import {AppRouteHandler} from '@gravity-ui/expresskit';

import {ApiTag} from '../../components/api-docs';
import {makeReqParser, z, zc} from '../../components/zod';
import {CONTENT_TYPE_JSON} from '../../const';
import LockService from '../../services/lock.service';

import {lockEntryModel} from './response-models/lock-entry-model';

const requestSchema = {
    params: z.object({
        entryId: zc.encodedId(),
    }),
};
const parseReq = makeReqParser(requestSchema);

export const verifyExistenceController: AppRouteHandler = async (req, res) => {
    const {params} = await parseReq(req);

    const {entryId} = params;

    const result = await LockService.verifyExistence({
        entryId,
        ctx: req.ctx,
    });

    res.status(200).send(lockEntryModel.format(result));
};

verifyExistenceController.api = {
    tags: [ApiTag.Locks],
    summary: 'Verify lock existence for entry',
    request: {
        params: requestSchema.params,
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

verifyExistenceController.manualDecodeId = true;
