import type {Knex} from 'knex';
import {TransactionOrKnex} from 'objection';

import {Entry, EntryColumn} from '../../models/new/entry';
import {RevisionModel} from '../../models/new/revision';
import {Tenant, TenantColumn} from '../../models/new/tenant';
import {
    JoinRevisionArgs,
    JoinedEntryRevision,
    JoinedEntryRevisionColumns,
    joinRevision,
    selectedColumns as joinedEntryRevisionColumns,
} from '../joined-entry-revision';

const selectedTenantColumns = [
    TenantColumn.BillingStartedAt,
    TenantColumn.BillingEndedAt,
    TenantColumn.Features,
    TenantColumn.Settings,
] as const;

const selectedColumns = [
    ...joinedEntryRevisionColumns,
    ...selectedTenantColumns.map((col) => `${Tenant.tableName}.${col}`),
];

export type JoinedEntryRevisionTenantColumns = JoinedEntryRevisionColumns &
    NullableValues<Pick<Tenant, ArrayElement<typeof selectedTenantColumns>>>;

export class JoinedEntryRevisionTenant extends JoinedEntryRevision {
    static findOne({
        where,
        joinRevisionArgs,
        trx,
    }: {
        where: Record<string, unknown> | ((builder: Knex.QueryBuilder) => void);
        joinRevisionArgs: JoinRevisionArgs;
        trx: TransactionOrKnex;
    }) {
        return this.query(trx)
            .select(selectedColumns)
            .join(RevisionModel.tableName, joinRevision(joinRevisionArgs))
            .leftJoin(Tenant.tableName, (builder) =>
                builder.on(
                    `${Entry.tableName}.${EntryColumn.TenantId}`,
                    `${Tenant.tableName}.${TenantColumn.TenantId}`,
                ),
            )
            .where(where)
            .first()
            .timeout(JoinedEntryRevision.DEFAULT_QUERY_TIMEOUT) as unknown as Promise<
            JoinedEntryRevisionTenantColumns | undefined
        >;
    }
}
