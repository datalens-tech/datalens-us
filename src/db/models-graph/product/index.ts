import {Model} from '../..';
import {Order} from '../order';
import {Shipment} from '../shipment';

export class Product extends Model {
    static get tableName() {
        return 'products';
    }

    static get idColumn() {
        return 'productId';
    }

    static get relationMappings() {
        return {
            shipments: {
                relation: Model.HasManyRelation,
                modelClass: Shipment,
                join: {
                    from: `${Product.tableName}.productId`,
                    to: `${Shipment.tableName}.productId`,
                },
            },

            orders: {
                relation: Model.ManyToManyRelation,
                modelClass: Order,
                join: {
                    from: `${Product.tableName}.productId`,
                    through: {
                        from: `${Shipment.tableName}.productId`,
                        to: `${Shipment.tableName}.orderId`,
                    },
                    to: `${Order.tableName}.orderId`,
                },
            },
        };
    }

    productId!: string;
    name!: string;

    shipments?: Shipment[];
    orders?: Order[];
}
