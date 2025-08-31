import type {Knex} from 'knex';
import {QueryBuilder, TransactionOrKnex, raw} from 'objection';

import {Customer} from '../../customer';
import {Product, ProductColumn} from '../../product';
import {Shipment, ShipmentColumn} from '../../shipment';
import {Order} from '../index';

import {JoinedOrderCustomerShipments} from './joined-order-customer-shipments';

export class JoinedOrderCustomerShipmentsProducts extends JoinedOrderCustomerShipments {
    static _joinProducts(builder: Knex.JoinClause) {
        builder.on(
            `${Shipment.tableName}.${ShipmentColumn.ProductId}`,
            `${Product.tableName}.${ProductColumn.ProductId}`,
        );
    }

    static get _selectedColumns() {
        return [
            ...super._selectedColumns,
            raw(`${Product.tableName}.${ProductColumn.Name} AS product_name`),
        ];
    }

    static query(trx: TransactionOrKnex) {
        const query = Order.query(trx)
            .select(this._selectedColumns)
            .join(Customer.tableName, this._joinCustomer)
            .rightJoin(Shipment.tableName, this._rightJoinShipments)
            .join(Product.tableName, this._joinProducts);

        return query as QueryBuilder<
            JoinedOrderCustomerShipmentsProducts,
            JoinedOrderCustomerShipmentsProducts[]
        >;
    }

    productName!: Product[typeof ProductColumn.Name];
}
