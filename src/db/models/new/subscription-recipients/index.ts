import {Model} from '../../..';

import {SubscriptionRecipientTransportType} from './types';

export const SubscriptionRecipientColumn = {
    SubscriptionId: 'subscriptionId',
    UserId: 'userId',
    Transport: 'transport',
    CreatedBy: 'createdBy',
    CreatedAt: 'createdAt',
} as const;

export class SubscriptionRecipient extends Model {
    static get tableName() {
        return 'subscription_recipients';
    }

    static get idColumn() {
        return [
            SubscriptionRecipientColumn.SubscriptionId,
            SubscriptionRecipientColumn.UserId,
            SubscriptionRecipientColumn.Transport,
        ];
    }

    [SubscriptionRecipientColumn.SubscriptionId]!: string;
    [SubscriptionRecipientColumn.UserId]!: string;
    [SubscriptionRecipientColumn.Transport]!: SubscriptionRecipientTransportType;
    [SubscriptionRecipientColumn.CreatedBy]!: string;
    [SubscriptionRecipientColumn.CreatedAt]!: string;
}
