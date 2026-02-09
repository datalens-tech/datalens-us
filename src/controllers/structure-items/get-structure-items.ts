import {AppRouteHandler} from '@gravity-ui/expresskit';

import {ApiTag} from '../../components/api-docs';
import {makeReqParser, z, zc} from '../../components/zod';
import {CONTENT_TYPE_JSON} from '../../const';
import {getStructureItems} from '../../services/new/structure-item';

import {structureItemsModel} from './response-models/structure-items-model';

const requestSchema = {
    query: z
        .object({
            collectionId: zc.encodedId().optional(),
            includePermissionsInfo: zc.stringBoolean().optional(),
            filterString: z.string().optional(),
            page: zc.stringNumber({min: 0}).optional(),
            pageSize: zc.stringNumber({min: 1, max: 200}).optional(),
            orderField: z.enum(['title', 'createdAt', 'updatedAt']).optional(),
            orderDirection: z.enum(['asc', 'desc']).optional(),
            onlyMy: zc.stringBoolean().optional(),
            mode: z.enum(['all', 'onlyCollections', 'onlyWorkbooks', 'onlyEntries']).optional(),
        })
        .superRefine(({collectionId, mode}, ctx) => {
            if (mode === 'onlyEntries' && !collectionId) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    path: ['mode', 'collectionId'],
                    message: "'collectionId' is required if mode is 'onlyEntries'",
                });
            }
        }),
};

const parseReq = makeReqParser(requestSchema);

export const getStructureItemsController: AppRouteHandler = async (req, res) => {
    const {query} = await parseReq(req);

    const result = await getStructureItems(
        {ctx: req.ctx},
        {
            collectionId: query.collectionId ?? null,
            includePermissionsInfo: query.includePermissionsInfo,
            filterString: query.filterString,
            page: query.page,
            pageSize: query.pageSize,
            orderField: query.orderField,
            orderDirection: query.orderDirection,
            onlyMy: query.onlyMy,
            mode: query.mode,
        },
    );

    res.status(200).send(
        await structureItemsModel.format({
            ...result,
            includePermissionsInfo: query.includePermissionsInfo,
        }),
    );
};

getStructureItemsController.api = {
    tags: [ApiTag.Structure],
    summary: 'Get structure items',
    request: {
        query: requestSchema.query,
    },
    responses: {
        200: {
            description: `${structureItemsModel.schema.description}`,
            content: {
                [CONTENT_TYPE_JSON]: {
                    schema: structureItemsModel.schema,
                },
            },
        },
    },
};

getStructureItemsController.manualDecodeId = true;
