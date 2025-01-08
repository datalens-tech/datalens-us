import {AppRouteHandler} from '@gravity-ui/expresskit';

import {ApiTag} from '../../components/api-docs';
import {makeValidator, z, zc} from '../../components/zod';
import {CONTENT_TYPE_JSON} from '../../const';
import {updateCollection} from '../../services/new/collection';

import {collectionModel} from './response-models';

const requestSchema = {
    params: z.object({
        collectionId: zc.encodedId(),
    }),
    body: z.object({
        title: z.string().optional(),
        description: z.string().optional(),
    }),
};

const validateParams = makeValidator(requestSchema.params);
const validateBody = makeValidator(requestSchema.body);

export const controller: AppRouteHandler = async (req, res) => {
    const params = validateParams(req.params);
    const body = validateBody(req.body);

    const result = await updateCollection(
        {ctx: req.ctx},
        {
            collectionId: params.collectionId,
            title: body.title,
            description: body.description,
        },
    );

    res.status(200).send(collectionModel.format(result));
};

controller.api = {
    summary: 'Update collection',
    tags: [ApiTag.Collections],
    request: {
        params: requestSchema.params,
        body: {
            content: {
                [CONTENT_TYPE_JSON]: {
                    schema: requestSchema.body,
                },
            },
        },
    },
    responses: {
        200: {
            description: collectionModel.schema.description ?? '',
            content: {
                [CONTENT_TYPE_JSON]: {
                    schema: collectionModel.schema,
                },
            },
        },
    },
};

controller.manualDecodeId = true;

export {controller as updateCollection};
