import {AppRouteHandler} from '@gravity-ui/expresskit';

import {ApiTag} from '../../components/api-docs';
import {makeReqParser, z, zc} from '../../components/zod';
import {CONTENT_TYPE_JSON} from '../../const';
import {getCollectionContent as getCollectionContentService} from '../../services/new/collection';

import {collectionContent} from './response-models';

const requestSchema = {
    query: z.object({
        collectionId: zc.encodedId().optional().nullable(),
        includePermissionsInfo: zc.stringBoolean().optional(),
        filterString: z.string().optional(),
        collectionsPage: z.string().optional().nullable(),
        workbooksPage: z.string().optional().nullable(),
        pageSize: zc.stringNumber().optional(),
        orderField: z.enum(['title', 'createdAt', 'updatedAt']).optional(),
        orderDirection: z.enum(['asc', 'desc']).optional(),
        onlyMy: zc.stringBoolean().optional(),
        mode: z.enum(['all', 'onlyCollections', 'onlyWorkbooks']).optional(),
    }),
};

const parseReq = makeReqParser(requestSchema);

export const controller: AppRouteHandler = async (req, res) => {
    const {query} = await parseReq(req);

    let collectionsPage: Optional<Nullable<number>>;
    if (query.collectionsPage === 'null') {
        collectionsPage = null;
    } else {
        collectionsPage = query.collectionsPage ? parseInt(query.collectionsPage, 10) : undefined;
    }

    let workbooksPage: Optional<Nullable<number>>;
    if (query.workbooksPage === 'null') {
        workbooksPage = null;
    } else {
        workbooksPage = query.workbooksPage ? parseInt(query.workbooksPage, 10) : undefined;
    }

    const result = await getCollectionContentService(
        {ctx: req.ctx},
        {
            collectionId: query.collectionId ?? null,
            includePermissionsInfo: query.includePermissionsInfo,
            filterString: query.filterString,
            collectionsPage,
            workbooksPage,
            pageSize: query.pageSize,
            orderField: query.orderField,
            orderDirection: query.orderDirection,
            onlyMy: query.onlyMy,
            mode: query.mode,
        },
    );

    res.status(200).send(await collectionContent.format(result));
};

controller.api = {
    summary: 'Get collection content',
    description: 'Get collection content',
    deprecated: true,
    tags: [ApiTag.Collections],
    request: {
        query: requestSchema.query,
    },
    responses: {
        200: {
            description: collectionContent.schema.description ?? '',
            content: {
                [CONTENT_TYPE_JSON]: {
                    schema: collectionContent.schema,
                },
            },
        },
    },
};

controller.manualDecodeId = true;

export {controller as getCollectionContent};
