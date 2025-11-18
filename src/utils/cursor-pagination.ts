import {AppError} from '@gravity-ui/nodekit';
import {Model, QueryBuilder, raw, ref} from 'objection';
import {z} from 'zod';

import {OrderBy, US_ERRORS} from '../const';

export interface PaginatorConfig<TFields extends string = string> {
    sortField: TFields;
    tiebreakerField: TFields;
    validationRules: Record<TFields, z.ZodSchema>;
    direction: OrderBy;
    limit: number;
    pageToken?: string;
}

export interface PaginationResult<T> {
    result: T[];
    nextPageToken?: string;
}

const CURSOR_SORT_COLUMN = '$cursorSort';
const CURSOR_TIEBREAKER_COLUMN = '$cursorTiebreaker';

type ItemWithCursor<T> = T & {[CURSOR_SORT_COLUMN]: string; [CURSOR_TIEBREAKER_COLUMN]: string};

const encodeCursorPageToken = (cursorValue: string, tiebreakerValue: string) => {
    const payload = JSON.stringify([cursorValue, tiebreakerValue]);
    return Buffer.from(payload, 'utf8').toString('base64url');
};

const decodeCursorPageToken = <TFields extends string>(params: {
    sortField: TFields;
    tiebreakerField: TFields;
    validationRules: Record<TFields, z.ZodSchema>;
    pageToken: string;
}) => {
    try {
        const {sortField, tiebreakerField, validationRules, pageToken} = params;

        const payload = Buffer.from(pageToken, 'base64url').toString('utf8');
        const parsedPayload = JSON.parse(payload);

        const result = z
            .tuple([validationRules[sortField], validationRules[tiebreakerField]])
            .safeParse(parsedPayload);

        if (!result.success) {
            throw new AppError(`Invalid page token: ${result.error.message}`, {
                code: US_ERRORS.INVALID_PAGE_TOKEN,
            });
        }

        return result.data;
    } catch (error) {
        if (error instanceof AppError) {
            throw error;
        }
        throw new AppError(
            `Invalid page token: ${error instanceof Error ? error.message : 'Unknown error'}`,
            {
                code: US_ERRORS.INVALID_PAGE_TOKEN,
            },
        );
    }
};

export function createPaginator<TFields extends string>(config: PaginatorConfig<TFields>) {
    const onBuild = <M extends Model>(builder: QueryBuilder<M, M[]>) => {
        const {sortField, tiebreakerField, validationRules, direction, limit, pageToken} = config;

        if (!builder.hasSelects()) {
            throw new AppError('The query requires select statement', {
                code: US_ERRORS.QUERY_SELECT_IS_REQUIRED_ERROR,
            });
        }

        builder.select(
            ref(sortField).castText().as(CURSOR_SORT_COLUMN),
            ref(tiebreakerField).castText().as(CURSOR_TIEBREAKER_COLUMN),
        );

        if (pageToken) {
            const [cursorValue, tiebreakerValue] = decodeCursorPageToken({
                sortField,
                tiebreakerField,
                validationRules,
                pageToken,
            });

            const operator = direction === OrderBy.Asc ? '>' : '<';

            builder.where(
                raw(`(??, ??) ${operator} (?, ?)`, [
                    sortField,
                    tiebreakerField,
                    cursorValue,
                    tiebreakerValue,
                ]),
            );
        }

        builder
            .orderBy(sortField, direction)
            .orderBy(tiebreakerField, direction)
            .limit(limit + 1);
    };

    const processResults = <M extends Model>(results: ItemWithCursor<M>[]): PaginationResult<M> => {
        const {limit} = config;

        const hasMore = results.length > limit;
        let nextPageToken: string | undefined;

        if (hasMore) {
            const lastItem = results[limit - 1];

            const sortValue = lastItem[CURSOR_SORT_COLUMN];
            const tiebreakerValue = lastItem[CURSOR_TIEBREAKER_COLUMN];

            nextPageToken = encodeCursorPageToken(sortValue, tiebreakerValue);
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
