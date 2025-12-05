import {Model} from '../../..';

import {
    SubscriptionArtifactType,
    SubscriptionContentType,
    SubscriptionStatus,
    SubscriptionTriggerType,
} from './types';

export const SubscriptionColumn = {
    SubscriptionId: 'subscriptionId',
    Title: 'title',
    Description: 'description',
    Meta: 'meta',
    Status: 'status',
    TenantId: 'tenantId',
    WorkbookId: 'workbookId',
    CreatedBy: 'createdBy',
    CreatedAt: 'createdAt',
    UpdatedBy: 'updatedBy',
    UpdatedAt: 'updatedAt',
    SuspendedAt: 'suspendedAt',
    ContentType: 'contentType',
    ContentEntryId: 'contentEntryId',
    ContentOptions: 'contentOptions',
    TriggerType: 'triggerType',
    TriggerEntryId: 'triggerEntryId',
    TriggerOptions: 'triggerOptions',
    ArtifactType: 'artifactType',
    ArtifactOptions: 'artifactOptions',
} as const;

export class Subscription extends Model {
    static get tableName() {
        return 'subscriptions';
    }

    static get idColumn() {
        return SubscriptionColumn.SubscriptionId;
    }

    [SubscriptionColumn.SubscriptionId]!: string;
    [SubscriptionColumn.Title]!: string;
    [SubscriptionColumn.Description]!: Nullable<string>;
    [SubscriptionColumn.Meta]!: Record<string, unknown>;
    [SubscriptionColumn.Status]!: SubscriptionStatus;
    [SubscriptionColumn.TenantId]!: string;
    [SubscriptionColumn.WorkbookId]!: string;
    [SubscriptionColumn.CreatedBy]!: string;
    [SubscriptionColumn.CreatedAt]!: string;
    [SubscriptionColumn.UpdatedBy]!: string;
    [SubscriptionColumn.UpdatedAt]!: string;
    [SubscriptionColumn.SuspendedAt]!: Nullable<string>;
    [SubscriptionColumn.ContentType]!: SubscriptionContentType;
    [SubscriptionColumn.ContentEntryId]!: string;
    [SubscriptionColumn.ContentOptions]!: Record<string, unknown>;
    [SubscriptionColumn.TriggerType]!: SubscriptionTriggerType;
    [SubscriptionColumn.TriggerEntryId]!: Nullable<string>;
    [SubscriptionColumn.TriggerOptions]!: Record<string, unknown>;
    [SubscriptionColumn.ArtifactType]!: SubscriptionArtifactType;
    [SubscriptionColumn.ArtifactOptions]!: Record<string, unknown>;
}
