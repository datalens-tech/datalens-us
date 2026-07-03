import {AppError} from '@gravity-ui/nodekit';
import {Model, QueryBuilder, raw, ref} from 'objection';
import {z} from 'zod';

import {InvalidPageTokenError, QuerySelectIsRequiredError} from '../components/errors';
import {OrderBy} from '../const';

export interface SortFieldConfig {
    field: string;
    direction: OrderBy;
    validate: z.ZodType<string>;
}

export interface PaginatorConfig {
    sortFields: SortFieldConfig[];
    tiebreakerField: SortFieldConfig;
    limit: number;
    pageToken?: string;
}

export interface PaginationResult<T> {
    result: T[];
    nextPageToken?: string;
}

const CURSOR_COLUMN_PREFIX = '$cursor';

type ItemWithCursor<T> = T & Record<string, string>;

const encodeCursorPageToken = (values: string[]): string => {
    const payload = JSON.stringify(values);
    return Buffer.from(payload, 'utf8').toString('base64url');
};

export const decodeCursorPageToken = (
    cursorFields: SortFieldConfig[],
    pageToken: string,
): string[] => {
    try {
        const payload = Buffer.from(pageToken, 'base64url').toString('utf8');
        const parsedPayload = JSON.parse(payload);

        if (!Array.isArray(parsedPayload) || parsedPayload.length !== cursorFields.length) {
            throw new InvalidPageTokenError();
        }

        return cursorFields.map((sf, i) => {
            const result = sf.validate.safeParse(parsedPayload[i]);
            if (!result.success) {
                throw new InvalidPageTokenError({
                    message: `Invalid page token: ${result.error.message}`,
                });
            }
            return result.data;
        });
    } catch (error) {
        if (error instanceof AppError) {
            throw error;
        }
        throw new InvalidPageTokenError({
            message: `Invalid page token: ${error instanceof Error ? error.message : 'Unknown error'}`,
        });
    }
};

const getOperator = (direction: OrderBy) => (direction === OrderBy.Asc ? '>' : '<');

const buildCursorWhereClause = (fields: SortFieldConfig[], values: string[]) => {
    const allSameDirection = fields.every((sf) => sf.direction === fields[0].direction);

    if (allSameDirection) {
        const operator = getOperator(fields[0].direction);
        const identifierPlaceholders = fields.map(() => '??').join(', ');
        const valuePlaceholders = values.map(() => '?').join(', ');
        const bindings = [...fields.map((sf) => sf.field), ...values];
        return raw(`(${identifierPlaceholders}) ${operator} (${valuePlaceholders})`, bindings);
    }

    // OR expansion for mixed directions
    const orParts: string[] = [];
    const allBindings: string[] = [];
    const eqParts: string[] = [];
    const eqBindings: string[] = [];

    for (const [i, sf] of fields.entries()) {
        const operator = getOperator(sf.direction);
        orParts.push(`(${[...eqParts, `?? ${operator} ?`].join(' AND ')})`);
        allBindings.push(...eqBindings, sf.field, values[i]);
        eqParts.push('?? = ?');
        eqBindings.push(sf.field, values[i]);
    }

    return raw(orParts.join(' OR '), allBindings);
};

export function createPaginator(config: PaginatorConfig) {
    const {sortFields, tiebreakerField, limit, pageToken} = config;
    const cursorFields = [...sortFields, tiebreakerField];

    const onBuild = <M extends Model>(builder: QueryBuilder<M, M[]>) => {
        if (!builder.hasSelects()) {
            throw new QuerySelectIsRequiredError();
        }

        cursorFields.forEach((sf, i) => {
            builder.select(ref(sf.field).castText().as(`${CURSOR_COLUMN_PREFIX}${i}`));
        });

        if (pageToken) {
            const values = decodeCursorPageToken(cursorFields, pageToken);
            builder.where(buildCursorWhereClause(cursorFields, values));
        }

        cursorFields.forEach((sf) => {
            builder.orderBy(sf.field, sf.direction);
        });
        builder.limit(limit + 1);
    };

    const processResults = <M extends Model>(results: ItemWithCursor<M>[]): PaginationResult<M> => {
        const hasMore = results.length > limit;
        let nextPageToken: string | undefined;

        if (hasMore) {
            const lastItem = results[limit - 1];
            const values = cursorFields.map((_, i) => lastItem[`${CURSOR_COLUMN_PREFIX}${i}`]);
            nextPageToken = encodeCursorPageToken(values);
        }

        return {
            result: results.slice(0, limit) as M[],
            nextPageToken,
        };
    };

    return {
        async execute<M extends Model>(query: QueryBuilder<M, M[]>): Promise<PaginationResult<M>> {
            const paginatedQuery = query.onBuild((builder) => onBuild(builder));
            const results = (await paginatedQuery) as ItemWithCursor<M>[];
            return processResults<M>(results);
        },
    };
}
