import {AppRouteHandler, Response} from '@gravity-ui/expresskit';

import {ApiTag} from '../../components/api-docs';
import {makeReqParser, z, zc} from '../../components/zod';
import {CONTENT_TYPE_JSON} from '../../const';
import {EntryScope} from '../../db/models/new/entry/types';
import {getWorkbookContent} from '../../services/new/workbook';

import {workbookContentInstance} from './response-models';

const scopeEnum = z.nativeEnum(EntryScope);

const requestSchema = {
    params: z.object({
        workbookId: zc.encodedId(),
    }),
    query: z.object({
        includePermissionsInfo: zc.stringBoolean().optional(),
        page: zc.stringNumber().optional(),
        pageSize: zc.stringNumber().optional(),
        createdBy: z.string().optional(),
        orderBy: z
            .object({
                field: z.enum(['name', 'createdAt']),
                direction: z.enum(['asc', 'desc']),
            })
            .optional(),
        filters: z
            .object({
                name: z.string().optional(),
            })
            .optional(),
        scope: scopeEnum.or(z.array(scopeEnum)).optional(),
    }),
};

const parseReq = makeReqParser(requestSchema);

export const getWorkbookContentController: AppRouteHandler = async (req, res: Response) => {
    const {params, query} = await parseReq(req);

    const result = await getWorkbookContent(
        {ctx: req.ctx},
        {
            workbookId: params.workbookId,
            includePermissionsInfo: query.includePermissionsInfo,
            page: query.page,
            pageSize: query.pageSize,
            createdBy: query.createdBy,
            orderBy: query.orderBy,
            filters: query.filters,
            scope: query.scope,
        },
    );

    res.status(200).send(workbookContentInstance.format(result));
};

getWorkbookContentController.api = {
    summary: 'Get workbook content',
    tags: [ApiTag.Workbooks],
    request: {
        params: requestSchema.params,
        query: requestSchema.query,
    },
    responses: {
        200: {
            description: workbookContentInstance.schema.description ?? '',
            content: {
                [CONTENT_TYPE_JSON]: {
                    schema: workbookContentInstance.schema,
                },
            },
        },
    },
};

getWorkbookContentController.manualDecodeId = true;
