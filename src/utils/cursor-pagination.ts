import {AppError} from '@gravity-ui/nodekit';
import {Model, QueryBuilder, raw, ref} from 'objection';
import {z} from 'zod';

import {US_ERRORS} from '../const';

export interface PaginatorConfig<TFields extends string = string> {
    sortField: TFields;
    tiebreakerField: TFields;
    direction: 'asc' | 'desc';
    limit?: number;
    pageToken?: string;
    validationRules: Record<TFields, z.ZodSchema<any>>;
}

export interface PaginationResult<T> {
    result: T[];
    nextPageToken?: string;
}

const CursorColumn = '$cursor';

type ItemWithCursor<T> = T & {[CursorColumn]: string};

function encodeCursorPageToken(cursorValue: string, tiebreakerValue: string): string {
    const payload = JSON.stringify([cursorValue, tiebreakerValue]);
    return Buffer.from(payload, 'utf8').toString('base64url');
}

function decodeCursorPageToken<TFields extends string>(params: {
    token: string;
    sortField: TFields;
    tiebreakerField: TFields;
    validationRules: Record<TFields, z.ZodSchema<any>>;
}): [string, string] {
    try {
        const {token, sortField, tiebreakerField, validationRules} = params;
        const payload = Buffer.from(token, 'base64url').toString('utf8');
        const parsed = JSON.parse(payload);

        const sortFieldSchema = validationRules[sortField];
        const tiebreakerSchema = validationRules[tiebreakerField];

        const result = z.tuple([sortFieldSchema, tiebreakerSchema]).safeParse(parsed);

        if (!result.success) {
            throw new AppError(`Invalid cursor token: ${result.error.message}`, {
                code: US_ERRORS.INVALID_PAGE_TOKEN,
            });
        }

        return result.data;
    } catch (error) {
        if (error instanceof AppError) {
            throw error;
        }
        throw new AppError(
            `Invalid cursor token: ${error instanceof Error ? error.message : 'Unknown error'}`,
            {
                code: US_ERRORS.INVALID_PAGE_TOKEN,
            },
        );
    }
}

export function createPaginator<TFields extends string>(config: PaginatorConfig<TFields>) {
    const normalizedConfig = {
        limit: 100,
        ...config,
    };

    function onBuild<T>(builder: QueryBuilder<any, ItemWithCursor<T>[]>) {
        const {sortField, tiebreakerField, direction, limit, pageToken} = normalizedConfig;

        if (!builder.hasSelects()) {
            throw new AppError('The query requires select statement', {
                code: US_ERRORS.QUERY_SELECT_IS_REQUIRED_ERROR,
            });
        }

        builder.select(ref(sortField).castText().as(CursorColumn));

        if (pageToken) {
            const [cursorValue, tiebreakerValue] = decodeCursorPageToken({
                token: pageToken,
                sortField: normalizedConfig.sortField,
                tiebreakerField: normalizedConfig.tiebreakerField,
                validationRules: normalizedConfig.validationRules,
            });

            const operator = direction === 'asc' ? '>' : '<';

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
    }

    function processResults<T>(results: ItemWithCursor<T>[]): PaginationResult<T> {
        const {limit, tiebreakerField} = normalizedConfig;
        const hasMore = results.length > limit;
        let nextPageToken: string | undefined;

        if (hasMore) {
            const lastItem = results[limit - 1];
            const sortValue = lastItem[CursorColumn];
            const tiebreakerValue = String((lastItem as any)[tiebreakerField]);

            nextPageToken = encodeCursorPageToken(sortValue, tiebreakerValue);
        }

        return {
            result: results.slice(0, limit) as T[],
            nextPageToken,
        };
    }

    return {
        async execute<M extends Model, T>(
            query: QueryBuilder<M, T[]>,
        ): Promise<PaginationResult<T>> {
            const paginatedQuery = query.onBuild((builder) =>
                onBuild<T>(builder as QueryBuilder<M, ItemWithCursor<T>[]>),
            );
            const results = (await paginatedQuery) as ItemWithCursor<T>[];
            return processResults<T>(results);
        },
    };
}
