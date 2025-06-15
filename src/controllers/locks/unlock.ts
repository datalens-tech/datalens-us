import {AppRouteHandler, Response} from '@gravity-ui/expresskit';

import {ApiTag} from '../../components/api-docs';
import {makeReqParser, z, zc} from '../../components/zod';
import {CONTENT_TYPE_JSON} from '../../const';
import Lock from '../../db/models/lock';
import LockService from '../../services/lock.service';

import {lockEntryModel} from './response-models/lock-entry-model';

const requestSchema = {
    params: z.object({
        entryId: zc.encodedId(),
    }),
    query: z.object({
        lockToken: z.string().optional(),
        force: z.coerce.boolean().optional(),
    }),
};
const parseReq = makeReqParser(requestSchema);

export const unlockController: AppRouteHandler = async (req, res: Response) => {
    const {params, query} = await parseReq(req);

    const {entryId} = params;
    const {lockToken, force} = query;

    const result = (await LockService.unlock({
        entryId,
        lockToken,
        force,
        ctx: req.ctx,
    })) as unknown as Lock;

    res.status(200).send(lockEntryModel.format(result));
};

unlockController.api = {
    tags: [ApiTag.Locks],
    summary: 'Unlock entry',
    request: {
        params: requestSchema.params,
        query: requestSchema.query,
    },
    responses: {
        200: {
            description: lockEntryModel.schema.description ?? '',
            content: {
                [CONTENT_TYPE_JSON]: {
                    schema: lockEntryModel.schema,
                },
            },
        },
    },
};
unlockController.manualDecodeId = true;
