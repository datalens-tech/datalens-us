import {Request, Response} from '@gravity-ui/expresskit';

import {DEFAULT_QUERY_TIMEOUT} from '../const';
import {Order, OrderColumn} from '../db/models-presentations/order';
import {JoinedOrderCustomer} from '../db/models-presentations/order/presentations/joined-order-customer';
// import {JoinedOrderCustomerShipments} from '../db/models-presentations/order/presentations/joined-order-customer-shipments';
// import {JoinedOrderCustomerShipmentsProducts} from '../db/models-presentations/order/presentations/joined-order-customer-shipments-products';
// import {PartialOrder} from '../db/models-presentations/order/presentations/partial-order';

export default async function testPresentationsController(_: Request, res: Response) {
    const result = await JoinedOrderCustomer.query(Order.replica)
        .where({
            [`${Order.tableName}.${OrderColumn.OrderId}`]: '1988457138476811343',
        })
        // .findOne({
        //     orderId: '1988457138476811343',
        // })
        .first()
        .timeout(DEFAULT_QUERY_TIMEOUT);

    res.status(200).send(result);
}
