import {AppRouteHandler} from '@gravity-ui/expresskit';

import {ApiTag} from '../../components/api-docs';
import {makeReqParser, z, zc} from '../../components/zod';
import {ALLOWED_ENTRIES_SCOPE, CONTENT_TYPE_JSON} from '../../const';
import {RelationDirection, getEntryRelations} from '../../services/entry';

import {entryRelationsPageModel} from './response-models/entry-relations-page-model';

const requestSchema = {
    params: z.object({
        entryId: zc.encodedId(),
    }),
    query: z.object({
        direction: z.enum(RelationDirection).optional(),
        includePermissionsInfo: zc.stringBoolean().optional(),
        scope: z.enum(ALLOWED_ENTRIES_SCOPE).optional(),
        page: zc.stringNumber({min: 0}).optional(),
        pageSize: zc.stringNumber({min: 1, max: 200}).optional(),
    }),
};

const parseReq = makeReqParser(requestSchema);

export const getRelationsController: AppRouteHandler = async (req, res) => {
    const {params, query} = await parseReq(req);

    const result = await getEntryRelations(
        {ctx: req.ctx},
        {
            entryId: params.entryId,
            direction: query.direction,
            includePermissionsInfo: query.includePermissionsInfo,
            scope: query.scope,
            page: query.page,
            pageSize: query.pageSize,
        },
    );

    const formatted = await entryRelationsPageModel.format(result);

    // TODO: leave a response with pagination only, when there will be pagination support everywhere in the frontend
    const responseData =
        typeof query.page !== 'undefined' && typeof query.pageSize !== 'undefined'
            ? formatted
            : formatted.relations;

    res.status(200).send(responseData);
};

getRelationsController.api = {
    summary: 'Get entry relations',
    tags: [ApiTag.Entries],
    request: {
        params: requestSchema.params,
        query: requestSchema.query,
    },
    responses: {
        200: {
            description: entryRelationsPageModel.schema.description ?? '',
            content: {
                [CONTENT_TYPE_JSON]: {
                    schema: z.union([
                        entryRelationsPageModel.schema,
                        entryRelationsPageModel.schema.shape.relations,
                    ]),
                },
            },
        },
    },
};

getRelationsController.manualDecodeId = true;
