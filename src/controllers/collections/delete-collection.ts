import {AppRouteHandler} from '@gravity-ui/expresskit';

import {ApiTag} from '../../components/api-docs';
import {makeReqParser, z, zc} from '../../components/zod';
import {CONTENT_TYPE_JSON} from '../../const';
import {LogEventType} from '../../registry/common/utils/log-event/types';
import {deleteCollections} from '../../services/new/collection';

import {collectionModelArrayInObject} from './response-models';

const requestSchema = {
    params: z.object({
        collectionId: zc.encodedId(),
    }),
};

export type DeleteCollectionReqParams = z.infer<typeof requestSchema.params>;

const parseReq = makeReqParser(requestSchema);

export const controller: AppRouteHandler = async (req, res) => {
    const {params} = await parseReq(req);

    const registry = req.ctx.get('registry');
    const {logEvent} = registry.common.functions.get();

    try {
        const result = await deleteCollections(
            {ctx: req.ctx},
            {
                collectionIds: [params.collectionId],
            },
        );

        logEvent({
            type: LogEventType.DeleteCollectionSuccess,
            ctx: req.ctx,
            reqParams: params,
            collections: result.collections,
        });

        res.status(200).send(await collectionModelArrayInObject.format(result));
    } catch (error) {
        logEvent({
            type: LogEventType.DeleteCollectionFail,
            ctx: req.ctx,
            reqParams: params,
            error,
        });

        throw error;
    }
};

controller.api = {
    summary: 'Delete collection',
    tags: [ApiTag.Collections],
    request: {
        params: requestSchema.params,
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

export {controller as deleteCollection};
