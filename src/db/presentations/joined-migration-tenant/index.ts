import type {Knex} from 'knex';
import {TransactionOrKnex} from 'objection';
import {Tenant, TenantColumn} from '../../models/new/tenant';
import {MigrationTenant, MigrationTenantColumn} from '../../models/new/migration-tenant';

const selectedTenantColumns = [
    TenantColumn.TenantId,
    TenantColumn.Meta,
    TenantColumn.CreatedAt,
    TenantColumn.Enabled,
    TenantColumn.Deleting,
    TenantColumn.LastInitAt,
    TenantColumn.RetriesCount,
    TenantColumn.CollectionsEnabled,
    TenantColumn.FoldersEnabled,
    TenantColumn.BillingRate,
    TenantColumn.BillingAccountId,
    TenantColumn.BillingInstanceServiceId,
    TenantColumn.BillingStartedAt,
] as const;

const selectedMigrationTenantColumns = [
    MigrationTenantColumn.FromId,
    MigrationTenantColumn.ToId,
    MigrationTenantColumn.Migrating,
    MigrationTenantColumn.MigrationMeta,
] as const;

export const JoinedMigrationTenantColumn = {
    TenantId: TenantColumn.TenantId,
    Meta: TenantColumn.Meta,
    CreatedAt: TenantColumn.CreatedAt,
    Enabled: TenantColumn.Enabled,
    Deleting: TenantColumn.Deleting,
    LastInitAt: TenantColumn.LastInitAt,
    RetriesCount: TenantColumn.RetriesCount,
    CollectionsEnabled: TenantColumn.CollectionsEnabled,
    FoldersEnabled: TenantColumn.FoldersEnabled,
    BillingRate: TenantColumn.BillingRate,
    BillingAccountId: TenantColumn.BillingAccountId,
    BillingInstanceServiceId: TenantColumn.BillingInstanceServiceId,
    BillingStartedAt: TenantColumn.BillingStartedAt,
    FromId: MigrationTenantColumn.FromId,
    ToId: MigrationTenantColumn.ToId,
    Migrating: MigrationTenantColumn.Migrating,
    MigrationMeta: MigrationTenantColumn.MigrationMeta,
} as const;

export const selectedJoinedMigrationTenantColumns = [
    ...selectedTenantColumns.map((col) => `${Tenant.tableName}.${col}`),
    ...selectedMigrationTenantColumns.map((col) => `${MigrationTenant.tableName}.${col}`),
];

export type JoinMigrationTenantArgs = {
    joinColumnId:
        | typeof JoinedMigrationTenantColumn.FromId
        | typeof JoinedMigrationTenantColumn.ToId;
};

export const joinMigrationTenant =
    ({joinColumnId}: JoinMigrationTenantArgs) =>
    (builder: Knex.JoinClause) => {
        builder.on(
            `${Tenant.tableName}.${TenantColumn.TenantId}`,
            `${MigrationTenant.tableName}.${joinColumnId}`,
        );
    };

export type SelectedTenantColumns = Pick<Tenant, ArrayElement<typeof selectedTenantColumns>>;

type SelectedMigrationTenantColumns = Pick<
    MigrationTenant,
    ArrayElement<typeof selectedMigrationTenantColumns>
>;

export type LeftJoinedMigrationTenantColumns = SelectedTenantColumns &
    NullableValues<SelectedMigrationTenantColumns>;

type FullJoinedMigrationTenantColumns = NullableValues<SelectedTenantColumns> &
    NullableValues<SelectedMigrationTenantColumns>;

export class JoinedMigrationTenant extends Tenant {
    static findOneLeftJoined({
        where,
        joinMigrationTenantArgs,
        trx,
    }: {
        where: Record<string, unknown> | ((builder: Knex.QueryBuilder) => void);
        joinMigrationTenantArgs: JoinMigrationTenantArgs;
        trx: TransactionOrKnex;
    }) {
        return JoinedMigrationTenant.query(trx)
            .select(selectedJoinedMigrationTenantColumns)
            .leftJoin(MigrationTenant.tableName, joinMigrationTenant(joinMigrationTenantArgs))
            .where(where)
            .first()
            .timeout(JoinedMigrationTenant.DEFAULT_QUERY_TIMEOUT) as unknown as Promise<
            Optional<LeftJoinedMigrationTenantColumns>
        >;
    }

    static findLeftJoined({
        where,
        joinMigrationTenantArgs,
        trx,
    }: {
        where: Record<string, unknown> | ((builder: Knex.QueryBuilder) => void);
        joinMigrationTenantArgs: JoinMigrationTenantArgs;
        trx: TransactionOrKnex;
    }) {
        return JoinedMigrationTenant.query(trx)
            .select(selectedJoinedMigrationTenantColumns)
            .leftJoin(MigrationTenant.tableName, joinMigrationTenant(joinMigrationTenantArgs))
            .where(where)
            .timeout(JoinedMigrationTenant.DEFAULT_QUERY_TIMEOUT) as unknown as Promise<
            LeftJoinedMigrationTenantColumns[]
        >;
    }

    static findOneFullJoined({
        where,
        joinMigrationTenantArgs,
        trx,
    }: {
        where: Record<string, unknown> | ((builder: Knex.QueryBuilder) => void);
        joinMigrationTenantArgs: JoinMigrationTenantArgs;
        trx: TransactionOrKnex;
    }) {
        return JoinedMigrationTenant.query(trx)
            .select(selectedJoinedMigrationTenantColumns)
            .fullOuterJoin(MigrationTenant.tableName, joinMigrationTenant(joinMigrationTenantArgs))
            .where(where)
            .first()
            .timeout(JoinedMigrationTenant.DEFAULT_QUERY_TIMEOUT) as unknown as Promise<
            Optional<FullJoinedMigrationTenantColumns>
        >;
    }
}
