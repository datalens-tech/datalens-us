import {AppRouteHandler} from '@gravity-ui/expresskit';

import {ApiTag} from '../../components/api-docs';
import {makeReqParser, z, zc} from '../../components/zod';
import {CONTENT_TYPE_JSON} from '../../const';
import {LogEventType} from '../../registry/common/utils/log-event/types';
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

export const createCollectionController: AppRouteHandler = async (req, res) => {
    const {body} = await parseReq(req);

    const registry = req.ctx.get('registry');
    const {logEvent} = registry.common.functions.get();

    try {
        const result = await createCollection(
            {ctx: req.ctx},
            {
                title: body.title,
                description: body.description,
                parentId: body.parentId,
            },
        );

        logEvent({
            type: LogEventType.CreateCollectionSuccess,
            ctx: req.ctx,
            reqBody: body,
            collection: result.collection.model,
        });

        res.status(200).send(
            collectionInstanceWithOperation.format(result.collection, result.operation),
        );
    } catch (error) {
        logEvent({
            type: LogEventType.CreateCollectionFail,
            ctx: req.ctx,
            reqBody: body,
            error,
        });

        throw error;
    }
};

createCollectionController.api = {
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

createCollectionController.manualDecodeId = true;
