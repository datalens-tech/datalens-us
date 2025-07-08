import {Model} from '../..';

export const OrderColumn = {
    OrderId: 'orderId',
    CreatedAt: 'createdAt',
    CustomerId: 'customerId',
} as const;

export class Order extends Model {
    static get tableName() {
        return 'orders';
    }

    static get idColumn() {
        return OrderColumn.OrderId;
    }

    [OrderColumn.OrderId]!: string;
    [OrderColumn.CreatedAt]!: string;
    [OrderColumn.CustomerId]!: string;
}
