import {Model} from '../../..';

export const TenantColumn = {
    TenantId: 'tenantId',
    Meta: 'meta',
    CreatedAt: 'createdAt',
    Enabled: 'enabled',
    Deleting: 'deleting',
    LastInitAt: 'lastInitAt',
    RetriesCount: 'retriesCount',
    FoldersEnabled: 'foldersEnabled',
    CollectionsEnabled: 'collectionsEnabled',
} as const;

export class Tenant extends Model {
    static get tableName() {
        return 'tenants';
    }

    static get idColumn() {
        return TenantColumn.TenantId;
    }

    [TenantColumn.TenantId]!: string;
    [TenantColumn.Meta]!: Record<string, unknown>;
    [TenantColumn.CreatedAt]!: string;
    [TenantColumn.Enabled]!: boolean;
    [TenantColumn.Deleting]!: boolean;
    [TenantColumn.LastInitAt]!: string;
    [TenantColumn.RetriesCount]!: number;
    [TenantColumn.FoldersEnabled]!: boolean;
    [TenantColumn.CollectionsEnabled]!: boolean;
}
