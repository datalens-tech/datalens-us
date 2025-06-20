import {AppRouteHandler} from '@gravity-ui/expresskit';

import {ApiTag} from '../../components/api-docs';
import {makeReqParser, z, zc} from '../../components/zod';
import {CONTENT_TYPE_JSON} from '../../const';
import {getState} from '../../services/new/state/get-state';

import {stateModel} from './response-models/state-model';

const requestSchema = {
    params: z.object({
        entryId: zc.encodedId(),
        hash: z.string(),
    }),
};

const parseReq = makeReqParser(requestSchema);

export const getStateController: AppRouteHandler = async (req, res) => {
    const {params} = await parseReq(req);

    const result = await getState(
        {ctx: req.ctx},
        {
            entryId: params.entryId,
            hash: params.hash,
        },
    );

    res.status(200).send(stateModel.format(result));
};
getStateController.api = {
    tags: [ApiTag.States],
    summary: 'Get state for entry',
    request: {
        params: requestSchema.params,
    },
    responses: {
        200: {
            description: stateModel.schema.description ?? '',
            content: {
                [CONTENT_TYPE_JSON]: {
                    schema: stateModel.schema,
                },
            },
        },
    },
};
getStateController.manualDecodeId = true;
