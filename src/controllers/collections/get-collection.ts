import {AppRouteHandler} from '@gravity-ui/expresskit';

import {ApiTag} from '../../components/api-docs';
import {makeParser, z, zc} from '../../components/zod';
import {CONTENT_TYPE_JSON} from '../../const';
import {getCollection} from '../../services/new/collection';

import {collectionInstance} from './response-models';

const requestSchema = {
    params: z.object({
        collectionId: zc.encodedId(),
    }),
    query: z.object({
        includePermissionsInfo: zc.stringBoolean().optional(),
    }),
};

const parseParams = makeParser(requestSchema.params);
const parseQuery = makeParser(requestSchema.query);

export const controller: AppRouteHandler = async (req, res) => {
    const [params, query] = await Promise.all([parseParams(req.params), parseQuery(req.query)]);

    const result = await getCollection(
        {ctx: req.ctx},
        {
            collectionId: params.collectionId,
            includePermissionsInfo: query.includePermissionsInfo,
        },
    );

    res.status(200).send(collectionInstance.format(result));
};

controller.api = {
    summary: 'Get collection',
    tags: [ApiTag.Collections],
    request: {
        params: requestSchema.params,
        query: requestSchema.query,
    },
    responses: {
        200: {
            description: collectionInstance.schema.description ?? '',
            content: {
                [CONTENT_TYPE_JSON]: {
                    schema: collectionInstance.schema,
                },
            },
        },
    },
};

controller.manualDecodeId = true;

export {controller as getCollection};