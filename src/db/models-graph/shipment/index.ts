import {Model} from '../..';
import {Order} from '../order';
import {Product} from '../product';

export class Shipment extends Model {
    static get tableName() {
        return 'shipments';
    }

    static get idColumn() {
        return 'shipmentId';
    }

    static get relationMappings() {
        return {
            order: {
                relation: Model.BelongsToOneRelation,
                modelClass: Order,
                join: {
                    from: `${Shipment.tableName}.orderId`,
                    to: `${Order.tableName}.orderId`,
                },
            },

            product: {
                relation: Model.BelongsToOneRelation,
                modelClass: Product,
                join: {
                    from: `${Shipment.tableName}.productId`,
                    to: `${Product.tableName}.productId`,
                },
            },
        };
    }

    shipmentId!: string;
    orderId!: string;
    productId!: string;

    order?: Order;
    product?: Product;
}
