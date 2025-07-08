import {Model} from '../..';
import {Customer} from '../customer';
import {Product} from '../product';
import {Shipment} from '../shipment';

export class Order extends Model {
    static get tableName() {
        return 'orders';
    }

    static get idColumn() {
        return 'orderId';
    }

    static get relationMappings() {
        return {
            customer: {
                relation: Model.BelongsToOneRelation,
                modelClass: Customer,
                join: {
                    from: `${Order.tableName}.customerId`,
                    to: `${Customer.tableName}.customerId`,
                },
            },

            shipments: {
                relation: Model.HasManyRelation,
                modelClass: Shipment,
                join: {
                    from: `${Order.tableName}.orderId`,
                    to: `${Shipment.tableName}.orderId`,
                },
            },

            products: {
                relation: Model.ManyToManyRelation,
                modelClass: Product,
                join: {
                    from: `${Order.tableName}.orderId`,
                    through: {
                        from: `${Shipment.tableName}.orderId`,
                        to: `${Shipment.tableName}.productId`,
                    },
                    to: `${Product.tableName}.productId`,
                },
            },
        };
    }

    orderId!: string;
    createdAt!: string;
    customerId!: string;

    customer?: Customer;
    shipments?: Shipment[];
    products?: Product[];
}
