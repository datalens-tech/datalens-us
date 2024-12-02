import {Request, Response} from '@gravity-ui/expresskit';

import {prepareResponseAsync} from '../components/response-presenter';
import LockService from '../services/lock.service';
import * as ST from '../types/services.types';

export default {
    verifyExistence: async (req: Request, res: Response) => {
        const {params} = req;

        const result = await LockService.verifyExistence({
            entryId: params.entryId,
            ctx: req.ctx,
        });

        const {code, response} = await prepareResponseAsync({data: result});

        res.status(code).send(response);
    },
    lock: async (req: Request, res: Response) => {
        const {params, body} = req;

        const result = await LockService.lock({
            entryId: params.entryId,
            duration: body.duration,
            force: body.force,
            ctx: req.ctx,
        });

        const {code, response} = await prepareResponseAsync({data: result});

        res.status(code).send(response);
    },
    unlock: async (req: Request, res: Response) => {
        const query = req.query as unknown as ST.UnlockEntry;

        const result = await LockService.unlock({
            entryId: req.params.entryId,
            lockToken: query.lockToken,
            force: query.force,
            ctx: req.ctx,
        });

        const {code, response} = await prepareResponseAsync({data: result});

        res.status(code).send(response);
    },
    extend: async (req: Request, res: Response) => {
        const {params, body} = req;

        const result = await LockService.extend({
            entryId: params.entryId,
            duration: body.duration,
            lockToken: body.lockToken,
            force: body.force,
            ctx: req.ctx,
        });

        const {code, response} = await prepareResponseAsync({data: result});

        res.status(code).send(response);
    },
};
