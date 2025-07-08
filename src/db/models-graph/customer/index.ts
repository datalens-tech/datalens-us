import {Model} from '../..';
import {Order} from '../order';

export class Customer extends Model {
    static get tableName() {
        return 'customers';
    }

    static get idColumn() {
        return 'customerId';
    }

    static get relationMappings() {
        return {
            orders: {
                relation: Model.HasManyRelation,
                modelClass: Order,
                join: {
                    from: `${Customer.tableName}.customerId`,
                    to: `${Order.tableName}.customerId`,
                },
            },
        };
    }

    customerId!: string;
    name!: string;

    orders?: Order[];
}
