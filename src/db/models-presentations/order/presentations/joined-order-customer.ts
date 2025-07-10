import type {Knex} from 'knex';
import {QueryBuilder, TransactionOrKnex, raw} from 'objection';

import {Model} from '../../..';
import {Customer, CustomerColumn} from '../../customer';
import {Order, OrderColumn} from '../index';

export class JoinedOrderCustomer extends Model {
    static get tableName() {
        return Order.tableName;
    }

    static get idColumn() {
        return Order.idColumn;
    }

    static _joinCustomer(builder: Knex.JoinClause) {
        builder.on(
            `${Order.tableName}.${OrderColumn.CustomerId}`,
            `${Customer.tableName}.${CustomerColumn.CustomerId}`,
        );
    }

    static get _selectedColumns() {
        return [
            `${Order.tableName}.${OrderColumn.OrderId}`,
            `${Order.tableName}.${OrderColumn.CustomerId}`,
            `${Order.tableName}.${OrderColumn.CreatedAt}`,
            raw(`${Customer.tableName}.${CustomerColumn.Name} AS customer_name`),
        ];
    }

    static query(trx: TransactionOrKnex) {
        const query = Order.query(trx)
            .select(this._selectedColumns)
            .join(Customer.tableName, this._joinCustomer);

        return query as QueryBuilder<JoinedOrderCustomer, JoinedOrderCustomer[]>;
    }

    [OrderColumn.OrderId]!: Order[typeof OrderColumn.OrderId];
    [OrderColumn.CustomerId]!: Order[typeof OrderColumn.CustomerId];
    [OrderColumn.CreatedAt]!: Order[typeof OrderColumn.CreatedAt];
    [CustomerColumn.Name]!: Customer[typeof CustomerColumn.Name];
    customerName!: string;
}
