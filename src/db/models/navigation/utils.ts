import type {Knex} from 'knex';
import {raw} from 'objection';

import {COMPARISON_OPERATORS} from '../../../const';
import {InterTenantGetEntriesConfig} from '../../../types/models';

export type InterTenantGetEntriesArgs = Omit<
    InterTenantGetEntriesConfig,
    'page' | 'pageSize' | 'orderBy' | 'requestedBy'
>;

export const whereBuilderInterTenantGetEntries = ({
    ids,
    type,
    createdBy,
    meta,
    creationTimeFilters,
    scope,
    createdAtFrom,
}: InterTenantGetEntriesArgs & {createdAtFrom?: number}) => {
    return (builder: Knex.QueryBuilder) => {
        builder.where({
            isDeleted: false,
            scope,
        });

        if (ids) {
            if (Array.isArray(ids)) {
                builder.where('entries.entryId', 'in', ids);
            } else {
                builder.where('entries.entryId', ids);
            }
        }
        if (type) {
            builder.where('type', type);
        }
        if (createdBy) {
            builder.whereIn(
                'entries.createdBy',
                Array.isArray(createdBy) ? createdBy : [createdBy],
            );
        }
        if (meta) {
            Object.entries(meta).map(([metaField, value]) => {
                return builder.whereRaw('meta->>?::text = ?::text', [metaField, value]);
            });
        }
        if (creationTimeFilters) {
            Object.entries(creationTimeFilters).forEach(([comparisonOperator, date]) => {
                const sqlComparisonOperator = COMPARISON_OPERATORS[comparisonOperator];

                if (sqlComparisonOperator) {
                    return builder.whereRaw('entries.created_at ? ?', [
                        raw(sqlComparisonOperator),
                        date,
                    ]);
                }

                return;
            });
        } else if (createdAtFrom) {
            builder.andWhere('entries.created_at', '>', raw('to_timestamp(?)', [createdAtFrom]));
        }
    };
};
