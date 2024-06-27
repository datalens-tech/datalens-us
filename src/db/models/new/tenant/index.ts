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
    BillingInstanceServiceId: 'billingInstanceServiceId',
    BillingPausedByUser: 'billingPausedByUser',
    BillingInstanceServiceIsActive: 'billingInstanceServiceIsActive',
    BillingStartedAt: 'billingStartedAt',
    BillingEndedAt: 'billingEndedAt',
    Branding: 'branding',
    Settings: 'settings',
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
    [TenantColumn.BillingInstanceServiceId]!: Nullable<string>;
    [TenantColumn.BillingPausedByUser]!: boolean;
    [TenantColumn.BillingInstanceServiceIsActive]!: boolean;
    [TenantColumn.BillingStartedAt]!: Nullable<string>;
    [TenantColumn.BillingEndedAt]!: Nullable<string>;
    [TenantColumn.Branding]!: Record<string, unknown>;
    [TenantColumn.Settings]!: Record<string, unknown>;
}
