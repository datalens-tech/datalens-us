import {QueryBuilder, TransactionOrKnex} from 'objection';

import {Model} from '../../..';
import {Order, OrderColumn} from '../index';

export class PartialOrder extends Model {
    static get tableName() {
        return Order.tableName;
    }

    static get idColumn() {
        return Order.idColumn;
    }

    static get _selectedColumns() {
        return [
            `${Order.tableName}.${OrderColumn.OrderId}`,
            `${Order.tableName}.${OrderColumn.CreatedAt}`,
        ];
    }

    static query(trx: TransactionOrKnex) {
        const query = Order.query(trx).select(this._selectedColumns);
        return query as QueryBuilder<PartialOrder, PartialOrder[]>;
    }

    [OrderColumn.OrderId]!: Order[typeof OrderColumn.OrderId];
    [OrderColumn.CreatedAt]!: Order[typeof OrderColumn.CreatedAt];
}
