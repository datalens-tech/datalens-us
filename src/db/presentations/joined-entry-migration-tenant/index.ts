import type {Knex} from 'knex';
import {TransactionOrKnex} from 'objection';
import {Entry, EntryColumn} from '../../models/new/entry';
import {Tenant, TenantColumn} from '../../models/new/tenant';
import {MigrationTenant} from '../../models/new/migration-tenant';
import {
    LeftJoinedMigrationTenantColumns,
    selectedJoinedMigrationTenantColumns,
    JoinMigrationTenantArgs,
    joinMigrationTenant,
} from '../joined-migration-tenant';

const joinEntryMigrationTenant = (builder: Knex.JoinClause) => {
    builder.on(
        `${Entry.tableName}.${EntryColumn.TenantId}`,
        `${Tenant.tableName}.${TenantColumn.TenantId}`,
    );
};

export class JoinedEntryMigrationTenant extends Entry {
    static findOneTenant({
        where,
        joinMigrationTenantArgs,
        trx,
    }: {
        where: Record<string, unknown> | ((builder: Knex.QueryBuilder) => void);
        joinMigrationTenantArgs: JoinMigrationTenantArgs;
        trx: TransactionOrKnex;
    }) {
        return JoinedEntryMigrationTenant.query(trx)
            .select(selectedJoinedMigrationTenantColumns)
            .join(Tenant.tableName, joinEntryMigrationTenant)
            .leftJoin(MigrationTenant.tableName, joinMigrationTenant(joinMigrationTenantArgs))
            .where(where)
            .first()
            .timeout(JoinedEntryMigrationTenant.DEFAULT_QUERY_TIMEOUT) as unknown as Promise<
            Optional<LeftJoinedMigrationTenantColumns>
        >;
    }
}
