import {Request, Response} from '@gravity-ui/expresskit';

import {DEFAULT_QUERY_TIMEOUT} from '../const';
import {Order} from '../db/models-graph/order';

export default async function testGraphController(_: Request, res: Response) {
    const result = await Order.query(Order.replica)
        .withGraphJoined('[customer]')
        .timeout(DEFAULT_QUERY_TIMEOUT);

    res.status(200).send(result);

    // const result = await Order.query(Order.replica)
    //     .withGraphJoined('[customer, shipments.[product]]')
    //     .timeout(DEFAULT_QUERY_TIMEOUT);

    // res.status(200).send(result);

    // const result = await Order.query(Order.replica)
    //     .withGraphJoined('[customer, shipments.[product.[orders]], products.[orders]]')
    //     .first()
    //     .timeout(DEFAULT_QUERY_TIMEOUT);

    res.status(200).send(result);
}
