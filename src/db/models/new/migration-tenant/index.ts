import {Model} from '../../..';

export const MigrationTenantColumn = {
    FromId: 'fromId',
    ToId: 'toId',
    Migrating: 'migrating',
    MigrationMeta: 'migrationMeta',
    CreatedAt: 'createdAt',
} as const;

export class MigrationTenant extends Model {
    static get tableName() {
        return 'migrationsTenants';
    }

    static get idColumn() {
        return [MigrationTenantColumn.FromId, MigrationTenantColumn.ToId];
    }

    [MigrationTenantColumn.FromId]!: string;
    [MigrationTenantColumn.ToId]!: string;
    [MigrationTenantColumn.Migrating]!: boolean;
    [MigrationTenantColumn.MigrationMeta]!: Record<string, unknown>;
    [MigrationTenantColumn.CreatedAt]!: string;
}
