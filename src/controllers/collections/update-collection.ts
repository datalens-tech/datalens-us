import {AppRouteHandler} from '@gravity-ui/expresskit';

import {ApiTag} from '../../components/api-docs';
import {makeParser, z, zc} from '../../components/zod';
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

const parseParams = makeParser(requestSchema.params);
const parseBody = makeParser(requestSchema.body);

export const controller: AppRouteHandler = async (req, res) => {
    const [params, body] = await Promise.all([parseParams(req.params), parseBody(req.body)]);

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
