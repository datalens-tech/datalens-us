import {AppRouteHandler} from '@gravity-ui/expresskit';

import {ApiTag} from '../../components/api-docs';
import {makeReqParser, z, zc} from '../../components/zod';
import {CONTENT_TYPE_JSON} from '../../const';
import {LogEventType} from '../../registry/common/utils/log-event/types';
import {moveCollection} from '../../services/new/collection';

import {collectionModel} from './response-models';

const requestSchema = {
    params: z.object({
        collectionId: zc.encodedId(),
    }),
    body: z.object({
        parentId: zc.encodedId().nullable(),
        title: zc.entityName().optional(),
    }),
};

export type MoveCollectionReqParams = z.infer<typeof requestSchema.params>;

export type MoveCollectionReqBody = z.infer<typeof requestSchema.body>;

const parseReq = makeReqParser(requestSchema);

export const moveCollectionController: AppRouteHandler = async (req, res) => {
    const {params, body} = await parseReq(req);

    const registry = req.ctx.get('registry');
    const {logEvent} = registry.common.functions.get();

    try {
        const result = await moveCollection(
            {ctx: req.ctx},
            {
                collectionId: params.collectionId,
                parentId: body.parentId,
                title: body.title,
            },
        );

        logEvent({
            type: LogEventType.MoveCollectionSuccess,
            ctx: req.ctx,
            reqBody: body,
            reqParams: params,
            collection: result,
        });

        res.status(200).send(collectionModel.format(result));
    } catch (error) {
        logEvent({
            type: LogEventType.MoveCollectionFail,
            ctx: req.ctx,
            reqBody: body,
            reqParams: params,
            error,
        });

        throw error;
    }
};

moveCollectionController.api = {
    summary: 'Move collection',
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

moveCollectionController.manualDecodeId = true;
