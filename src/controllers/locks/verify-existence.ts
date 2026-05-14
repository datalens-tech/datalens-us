import {AppRouteHandler} from '@gravity-ui/expresskit';

import {ApiTag} from '../../components/api-docs';
import {makeReqParser, z, zc} from '../../components/zod';
import {CONTENT_TYPE_JSON} from '../../const';
import {verifyLockExistence} from '../../services/new/lock';

import {lockModel} from './response-models';

const requestSchema = {
    params: z.object({
        entryId: zc.encodedId(),
    }),
};

const parseReq = makeReqParser(requestSchema);

export const verifyExistenceController: AppRouteHandler = async (req, res) => {
    const {params} = await parseReq(req);

    const {entryId} = params;

    const result = await verifyLockExistence({ctx: req.ctx}, {entryId});

    res.status(200).send(lockModel.format(result));
};

verifyExistenceController.api = {
    tags: [ApiTag.Locks],
    summary: 'Verify lock existence',
    request: {
        params: requestSchema.params,
    },
    responses: {
        200: {
            description: `${lockModel.schema.description}`,
            content: {
                [CONTENT_TYPE_JSON]: {
                    schema: lockModel.schema,
                },
            },
        },
    },
};

verifyExistenceController.manualDecodeId = true;
