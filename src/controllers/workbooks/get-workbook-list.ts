import {AppRouteHandler, Response} from '@gravity-ui/expresskit';

import {ApiTag} from '../../components/api-docs';
import {makeReqParser, z, zc} from '../../components/zod';
import {CONTENT_TYPE_JSON} from '../../const';
import {getWorkbooksList} from '../../services/new/workbook';

import {
    WorkbookInstanceArrayWithNextPageToken,
    WorkbookInstanceArrayWithNextPageTokenResponseModel,
} from './response-models';

const requestSchema = {
    query: z.object({
        collectionId: zc.encodedId().optional(),
        includePermissionsInfo: zc.stringBoolean().optional(),
        filterString: z.string().optional(),
        page: zc.stringNumber().optional(),
        pageSize: zc.stringNumber().optional(),
        orderField: z.enum(['title', 'createdAt', 'updatedAt']).optional(),
        orderDirection: z.enum(['asc', 'desc']).optional(),
        onlyMy: zc.stringBoolean().optional(),
    }),
};

const parseReq = makeReqParser(requestSchema);

export const getWorkbookListController: AppRouteHandler = async (
    req,
    res: Response<WorkbookInstanceArrayWithNextPageTokenResponseModel>,
) => {
    const {query} = await parseReq(req);

    const result = await getWorkbooksList(
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
        },
    );

    res.status(200).send(WorkbookInstanceArrayWithNextPageToken.format(result));
};

getWorkbookListController.api = {
    summary: 'Get workbook list',
    tags: [ApiTag.Workbooks],
    request: {
        query: requestSchema.query,
    },
    responses: {
        200: {
            description: WorkbookInstanceArrayWithNextPageToken.schema.description ?? '',
            content: {
                [CONTENT_TYPE_JSON]: {
                    schema: WorkbookInstanceArrayWithNextPageToken.schema,
                },
            },
        },
    },
};

getWorkbookListController.manualDecodeId = true;
