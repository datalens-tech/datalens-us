import type {Knex} from 'knex';
import {QueryBuilder, TransactionOrKnex} from 'objection';

import {Customer} from '../../customer';
import {Shipment, ShipmentColumn} from '../../shipment';
import {Order, OrderColumn} from '../index';

import {JoinedOrderCustomer} from './joined-order-customer';

export class JoinedOrderCustomerShipments extends JoinedOrderCustomer {
    static _rightJoinShipments(builder: Knex.JoinClause) {
        builder.on(
            `${Order.tableName}.${OrderColumn.OrderId}`,
            `${Shipment.tableName}.${ShipmentColumn.OrderId}`,
        );
    }

    static get _selectedColumns() {
        return [
            ...super._selectedColumns,
            `${Shipment.tableName}.${ShipmentColumn.ShipmentId}`,
            `${Shipment.tableName}.${ShipmentColumn.ProductId}`,
        ];
    }

    static query(trx: TransactionOrKnex) {
        const query = Order.query(trx)
            .select(this._selectedColumns)
            .join(Customer.tableName, this._joinCustomer)
            .rightJoin(Shipment.tableName, this._rightJoinShipments);

        return query as QueryBuilder<JoinedOrderCustomerShipments, JoinedOrderCustomerShipments[]>;
    }

    [ShipmentColumn.ShipmentId]!: Shipment[typeof ShipmentColumn.ShipmentId];
    [ShipmentColumn.ProductId]!: Shipment[typeof ShipmentColumn.ProductId];
}
