import type {Knex} from 'knex';
import {TransactionOrKnex} from 'objection';

import {Entry, EntryColumn} from '../../models/new/entry';
import {Favorite} from '../../models/new/favorite';
import {RevisionModel} from '../../models/new/revision';
import {Tenant, TenantColumn} from '../../models/new/tenant';
import {JoinRevisionArgs, joinRevision} from '../joined-entry-revision';
import {
    JoinedEntryRevisionFavorite,
    JoinedEntryRevisionFavoriteColumns,
    selectedJoinedEntryRevisionFavoriteColumns,
} from '../joined-entry-revision-favorite';
import {leftJoinFavorite} from '../utils';

const selectedTenantColumns = [
    TenantColumn.BillingStartedAt,
    TenantColumn.BillingEndedAt,
    TenantColumn.Features,
] as const;

const selectedColumns = [
    ...selectedJoinedEntryRevisionFavoriteColumns,
    ...selectedTenantColumns.map((col) => `${Tenant.tableName}.${col}`),
];

export type JoinedEntryRevisionFavoriteTenantColumns = JoinedEntryRevisionFavoriteColumns &
    NullableValues<Pick<Tenant, ArrayElement<typeof selectedTenantColumns>>>;

export class JoinedEntryRevisionFavoriteTenant extends JoinedEntryRevisionFavorite {
    static findOne({
        where,
        joinRevisionArgs,
        userLogin,
        trx,
    }: {
        where: Record<string, unknown> | ((builder: Knex.QueryBuilder) => void);
        joinRevisionArgs: JoinRevisionArgs;
        userLogin: string;
        trx: TransactionOrKnex;
    }) {
        return this.query(trx)
            .select(selectedColumns)
            .join(RevisionModel.tableName, joinRevision(joinRevisionArgs))
            .leftJoin(Favorite.tableName, leftJoinFavorite(userLogin))
            .leftJoin(Tenant.tableName, (builder) =>
                builder.on(
                    `${Entry.tableName}.${EntryColumn.TenantId}`,
                    `${Tenant.tableName}.${TenantColumn.TenantId}`,
                ),
            )
            .where(where)
            .first()
            .timeout(JoinedEntryRevisionFavorite.DEFAULT_QUERY_TIMEOUT) as unknown as Promise<
            JoinedEntryRevisionFavoriteTenantColumns | undefined
        >;
    }
}
