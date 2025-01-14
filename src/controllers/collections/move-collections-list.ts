import {AppRouteHandler} from '@gravity-ui/expresskit';

import {ApiTag} from '../../components/api-docs';
import {makeReqParser, z, zc} from '../../components/zod';
import {CONTENT_TYPE_JSON} from '../../const';
import {moveCollectionsList} from '../../services/new/collection';

import {collectionModelArrayInObject} from './response-models';

const requestSchema = {
    body: z.object({
        collectionIds: zc.encodedIdArray({min: 1, max: 1000}),
        parentId: zc.encodedId().nullable(),
    }),
};

export type MoveCollectionsListReqBody = z.infer<typeof requestSchema.body>;

const parseReq = makeReqParser(requestSchema);

export const controller: AppRouteHandler = async (req, res) => {
    const {body} = await parseReq(req);

    const registry = req.ctx.get('registry');
    const {
        controllersCallbacks: {onMoveCollectionsListError, onMoveCollectionsListSuccess},
    } = registry.common.functions.get();

    try {
        const result = await moveCollectionsList(
            {ctx: req.ctx},
            {
                collectionIds: body.collectionIds,
                parentId: body.parentId,
            },
        );

        onMoveCollectionsListSuccess({
            ctx: req.ctx,
            reqBody: body,
            collections: result.collections,
        });

        res.status(200).send(await collectionModelArrayInObject.format(result));
    } catch (error) {
        onMoveCollectionsListError({
            ctx: req.ctx,
            reqBody: body,
            error,
        });

        throw error;
    }
};

controller.api = {
    summary: 'Move collections list',
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
            description: collectionModelArrayInObject.schema.description ?? '',
            content: {
                [CONTENT_TYPE_JSON]: {
                    schema: collectionModelArrayInObject.schema,
                },
            },
        },
    },
};

controller.manualDecodeId = true;

export {controller as moveCollectionsList};
