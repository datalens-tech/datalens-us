import {Model} from '../../..';
import {BillingRate} from './types';

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
    BillingRate: 'billingRate',
    BillingAccountId: 'billingAccountId',
    BillingInstanceServiceId: 'billingInstanceServiceId',
    BillingStartedAt: 'billingStartedAt',
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
    [TenantColumn.BillingRate]!: BillingRate;
    [TenantColumn.BillingAccountId]!: Nullable<string>;
    [TenantColumn.BillingInstanceServiceId]!: Nullable<string>;
    [TenantColumn.BillingStartedAt]!: Nullable<string>;
}

export {BillingRate};
