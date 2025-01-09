import {AppRouteHandler} from '@gravity-ui/expresskit';

import {ApiTag} from '../../components/api-docs';
import {makeParser, z, zc} from '../../components/zod';
import {CONTENT_TYPE_JSON} from '../../const';
import {getCollectionBreadcrumbs} from '../../services/new/collection';

import {collectionInstanceArray} from './response-models';

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

    const result = await getCollectionBreadcrumbs(
        {ctx: req.ctx},
        {
            collectionId: params.collectionId,
            includePermissionsInfo: query.includePermissionsInfo,
        },
    );

    res.status(200).send(await collectionInstanceArray.format(result));
};

controller.api = {
    summary: 'Get collection breadcrumbs',
    tags: [ApiTag.Collections],
    request: {
        params: requestSchema.params,
        query: requestSchema.query,
    },
    responses: {
        200: {
            description: collectionInstanceArray.schema.description ?? '',
            content: {
                [CONTENT_TYPE_JSON]: {
                    schema: collectionInstanceArray.schema,
                },
            },
        },
    },
};

controller.manualDecodeId = true;

export {controller as getCollectionBreadcrumbs};
