import {AppRouteHandler} from '@gravity-ui/expresskit';

import {ApiTag} from '../../components/api-docs';
import {makeReqParser, z, zc} from '../../components/zod';
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

export type UpdateCollectionReqParams = z.infer<typeof requestSchema.params>;

export type UpdateCollectionReqBody = z.infer<typeof requestSchema.body>;

const parseReq = makeReqParser(requestSchema);

export const controller: AppRouteHandler = async (req, res) => {
    const {params, body} = await parseReq(req);

    const registry = req.ctx.get('registry');
    const {
        controllersCallbacks: {onUpdateCollectionError, onUpdateCollectionSuccess},
    } = registry.common.functions.get();

    try {
        const result = await updateCollection(
            {ctx: req.ctx},
            {
                collectionId: params.collectionId,
                title: body.title,
                description: body.description,
            },
        );

        onUpdateCollectionSuccess({
            ctx: req.ctx,
            reqBody: body,
            reqParams: params,
            collection: result,
        });

        res.status(200).send(collectionModel.format(result));
    } catch (error) {
        onUpdateCollectionError({
            ctx: req.ctx,
            reqBody: body,
            reqParams: params,
            error,
        });

        throw error;
    }
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
