import {Model} from '../..';

export const CustomerColumn = {
    CustomerId: 'customerId',
    Name: 'name',
} as const;

export class Customer extends Model {
    static get tableName() {
        return 'customers';
    }

    static get idColumn() {
        return CustomerColumn.CustomerId;
    }

    [CustomerColumn.CustomerId]!: string;
    [CustomerColumn.Name]!: string;
}
