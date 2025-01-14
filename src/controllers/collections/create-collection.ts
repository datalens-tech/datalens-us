import {AppRouteHandler} from '@gravity-ui/expresskit';

import {ApiTag} from '../../components/api-docs';
import {makeReqParser, z, zc} from '../../components/zod';
import {CONTENT_TYPE_JSON} from '../../const';
import {createCollection} from '../../services/new/collection';

import {collectionInstanceWithOperation} from './response-models';

const requestSchema = {
    body: z.object({
        title: z.string(),
        description: z.string().optional(),
        parentId: zc.encodedId().nullable(),
    }),
};

export type CreateCollectionReqBody = z.infer<typeof requestSchema.body>;

const parseReq = makeReqParser(requestSchema);

const controller: AppRouteHandler = async (req, res) => {
    const {body} = await parseReq(req);

    const registry = req.ctx.get('registry');
    const {
        controllersCallbacks: {onCreateCollectionError, onCreateCollectionSuccess},
    } = registry.common.functions.get();

    try {
        const result = await createCollection(
            {ctx: req.ctx},
            {
                title: body.title,
                description: body.description,
                parentId: body.parentId,
            },
        );

        onCreateCollectionSuccess({
            ctx: req.ctx,
            reqBody: body,
            collection: result.collection.model,
        });

        res.status(200).send(
            collectionInstanceWithOperation.format(result.collection, result.operation),
        );
    } catch (error) {
        onCreateCollectionError({ctx: req.ctx, reqBody: body, error});

        throw error;
    }
};

controller.api = {
    summary: 'Create collection',
    tags: [ApiTag.Collections],
    request: {
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
            description: collectionInstanceWithOperation.schema.description ?? '',
            content: {
                [CONTENT_TYPE_JSON]: {
                    schema: collectionInstanceWithOperation.schema.omit({permissions: true}),
                },
            },
        },
    },
};

controller.manualDecodeId = true;

export {controller as createCollection};
