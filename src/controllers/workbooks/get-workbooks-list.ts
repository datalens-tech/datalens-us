import {AppRouteHandler, Response} from '@gravity-ui/expresskit';

import {ApiTag} from '../../components/api-docs';
import {makeReqParser, z, zc} from '../../components/zod';
import {CONTENT_TYPE_JSON} from '../../const';
import {getWorkbooksList} from '../../services/new/workbook';

import {WorkbookInstancePage, workbookInstancePage} from './response-models';

const requestSchema = {
    query: z.object({
        collectionId: zc.encodedId().optional(),
        includePermissionsInfo: zc.stringBoolean().optional(),
        filterString: z.string().optional(),
        orderField: z.enum(['title', 'createdAt', 'updatedAt']).optional(),
        orderDirection: z.enum(['asc', 'desc']).optional(),
        onlyMy: zc.stringBoolean().optional(),
        page: zc.stringNumber({min: 0}).optional(),
        pageSize: zc.stringNumber({min: 1, max: 1000}).optional(),
    }),
};

const parseReq = makeReqParser(requestSchema);

export const getWorkbooksListController: AppRouteHandler = async (
    req,
    res: Response<WorkbookInstancePage>,
) => {
    const {query} = await parseReq(req);

    const result = await getWorkbooksList(
        {ctx: req.ctx},
        {
            collectionId: query.collectionId ?? null,
            includePermissionsInfo: query.includePermissionsInfo,
            filterString: query.filterString,
            orderField: query.orderField,
            orderDirection: query.orderDirection,
            onlyMy: query.onlyMy,
            page: query.page,
            pageSize: query.pageSize,
        },
    );

    res.status(200).send(await workbookInstancePage.format(result));
};

getWorkbooksListController.api = {
    summary: 'Get workbooks list',
    tags: [ApiTag.Workbooks],
    request: {
        query: requestSchema.query,
    },
    responses: {
        200: {
            description: `${workbookInstancePage.schema.description}`,
            content: {
                [CONTENT_TYPE_JSON]: {
                    schema: workbookInstancePage.schema,
                },
            },
        },
    },
};

getWorkbooksListController.manualDecodeId = true;
