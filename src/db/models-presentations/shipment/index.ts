import {Model} from '../..';

export const ShipmentColumn = {
    ShipmentId: 'shipmentId',
    OrderId: 'orderId',
    ProductId: 'productId',
} as const;

export class Shipment extends Model {
    static get tableName() {
        return 'shipments';
    }

    static get idColumn() {
        return 'shipmentId';
    }

    [ShipmentColumn.ShipmentId]!: string;
    [ShipmentColumn.OrderId]!: string;
    [ShipmentColumn.ProductId]!: string;
}
