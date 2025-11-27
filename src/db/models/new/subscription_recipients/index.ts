import {Model} from '../../..';

import {SubscriptionRecipientTransportType} from './types';

export const SubscriptionRecipientColumn = {
    SubscriptionRecipientId: 'subscriptionRecipientId',
    SubscriptionId: 'subscriptionId',
    UserId: 'userId',
    transport: 'transport',
    CreatedBy: 'createdBy',
    CreatedAt: 'createdAt',
} as const;

export class SubscriptionRecipient extends Model {
    static get tableName() {
        return 'subscription_recipients';
    }

    static get idColumn() {
        return SubscriptionRecipientColumn.SubscriptionRecipientId;
    }

    [SubscriptionRecipientColumn.SubscriptionRecipientId]?: string;
    [SubscriptionRecipientColumn.SubscriptionId]!: string;
    [SubscriptionRecipientColumn.UserId]?: string;
    [SubscriptionRecipientColumn.transport]?: SubscriptionRecipientTransportType;
    [SubscriptionRecipientColumn.CreatedBy]?: string;
    [SubscriptionRecipientColumn.CreatedAt]?: string;
}
