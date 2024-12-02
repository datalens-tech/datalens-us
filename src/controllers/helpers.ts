import {Request, Response} from '@gravity-ui/expresskit';

import {db} from '../db';

export default {
    ping: async (_: Request, res: Response) => {
        res.send({result: 'pong'});
    },

    pingDb: async (req: Request, res: Response) => {
        const {ctx} = req;

        try {
            await db.replica.raw('select 1 + 1');

            res.send({result: 'pong-db'});
        } catch (error) {
            ctx.logError('PING_FAILED', error);

            res.status(502).send({result: false});
        }
    },

    pingDbPrimary: async (req: Request, res: Response) => {
        const {ctx} = req;

        try {
            await db.primary.raw('select 1 + 1');

            res.send({result: 'db primary is ok'});
        } catch (error) {
            ctx.logError('PING_FAILED', error);

            res.status(502).send({result: 'db primary is not available'});
        }
    },

    pool: async (req: Request, res: Response) => {
        const {ctx} = req;

        try {
            const primaryPool = db.primary.client.pool;
            const replicaPool = db.replica.client.pool;

            const result = {
                primary: {
                    used: primaryPool.numUsed(),
                    free: primaryPool.numFree(),
                    numPendingAcquires: primaryPool.numPendingAcquires(),
                    numPendingCreates: primaryPool.numPendingCreates(),
                },
                replica: {
                    used: replicaPool.numUsed(),
                    free: replicaPool.numFree(),
                    numPendingAcquires: replicaPool.numPendingAcquires(),
                    numPendingCreates: replicaPool.numPendingCreates(),
                },
            };

            res.send({result});
        } catch (error) {
            ctx.logError('GET_POOL_FAILED', error);

            res.status(502).send({result: false});
        }
    },
};
