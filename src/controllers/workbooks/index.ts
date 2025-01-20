import {Request, Response} from '@gravity-ui/expresskit';

import {prepareResponseAsync} from '../../components/response-presenter';
import {
    OrderDirection,
    OrderField,
    copyWorkbookTemplate,
    getAllWorkbooks,
    getWorkbook,
    getWorkbookContent,
    getWorkbooksList,
    restoreWorkbook,
    setWorkbookIsTemplate,
} from '../../services/new/workbook';
import {
    formatGetWorkbookContent,
    formatRestoreWorkbook,
    formatSetWorkbookIsTemplate,
    formatWorkbook,
    formatWorkbookModel,
    formatWorkbookModelWithOperation,
    formatWorkbookModelsList,
    formatWorkbooksList,
} from '../../services/new/workbook/formatters';
import {getWorkbooksListByIds} from '../../services/new/workbook/get-workbooks-list-by-ids';
import Utils from '../../utils';

import {copyWorkbook} from './copy-workbook';
import {createWorkbook} from './create-workbook';
import {deleteWorkbook} from './delete-workbook';
import {deleteWorkbooksList} from './delete-workbooks-list';
import {moveWorkbook} from './move-workbook';
import {moveWorkbooksList} from './move-workbooks-list';
import {updateWorkbook} from './update-workbook';

export default {
    createWorkbook,
    updateWorkbook,
    moveWorkbook,
    moveWorkbooksList,
    deleteWorkbook,
    deleteWorkbooksList,
    copyWorkbook,

    get: async (req: Request, res: Response) => {
        const {params, query} = req;

        const result = await getWorkbook(
            {
                ctx: req.ctx,
            },
            {
                workbookId: params.workbookId,
                includePermissionsInfo: Utils.isTrueArg(query.includePermissionsInfo),
            },
        );

        const formattedResponse = formatWorkbook(result);
        const {code, response} = await prepareResponseAsync({data: formattedResponse});
        res.status(code).send(response);
    },

    getContent: async (req: Request, res: Response) => {
        const {query, params} = req;

        const result = await getWorkbookContent(
            {ctx: req.ctx},
            {
                workbookId: params.workbookId,
                includePermissionsInfo: Utils.isTrueArg(query.includePermissionsInfo),
                page: (query.page && Number(query.page)) as number | undefined,
                pageSize: (query.pageSize && Number(query.pageSize)) as number | undefined,
                createdBy: query.createdBy as any,
                orderBy: query.orderBy as any,
                filters: query.filters as any,
                scope: query.scope as any,
            },
        );

        const formattedResponse = formatGetWorkbookContent(result);
        const {code, response} = await prepareResponseAsync({data: formattedResponse});
        res.status(code).send(response);
    },

    getList: async (req: Request, res: Response) => {
        const {query} = req;

        const result = await getWorkbooksList(
            {ctx: req.ctx},
            {
                collectionId: (query.collectionId as Optional<string>) ?? null,
                includePermissionsInfo: Utils.isTrueArg(query.includePermissionsInfo),
                filterString: query.filterString as Optional<string>,
                page: (query.page && Number(query.page)) as number | undefined,
                pageSize: (query.pageSize && Number(query.pageSize)) as number | undefined,
                orderField: query.orderField as Optional<OrderField>,
                orderDirection: query.orderDirection as Optional<OrderDirection>,
                onlyMy: Utils.isTrueArg(query.onlyMy),
            },
        );

        const formattedResponse = formatWorkbooksList(result);
        const {code, response} = await prepareResponseAsync({data: formattedResponse});
        res.status(code).send(response);
    },

    getWorkbooksListByIds: async (req: Request, res: Response) => {
        const {body} = req;

        const result = await getWorkbooksListByIds(
            {ctx: req.ctx},
            {
                workbookIds: body.workbookIds,
            },
        );

        const formattedResponse = result.map((instance) => formatWorkbookModel(instance.model));
        const {code, response} = await prepareResponseAsync({data: formattedResponse});
        res.status(code).send(response);
    },

    setIsTemplate: async (req: Request, res: Response) => {
        const {body, params} = req;

        const result = await setWorkbookIsTemplate(
            {
                ctx: req.ctx,
            },
            {
                workbookId: params.workbookId,
                isTemplate: body.isTemplate,
            },
        );

        const formattedResponse = formatSetWorkbookIsTemplate(result);
        const {code, response} = await prepareResponseAsync({data: formattedResponse});
        res.status(code).send(response);
    },

    copyTemplate: async (req: Request, res: Response) => {
        const {body, params} = req;

        const result = await copyWorkbookTemplate(
            {
                ctx: req.ctx,
            },
            {
                workbookId: params.workbookId,
                collectionId: body.collectionId ?? null,
                // newTitle for compatibility
                title: body.title ?? body.newTitle,
            },
        );

        const formattedResponse = formatWorkbookModelWithOperation(
            result.workbook,
            result.operation,
        );
        const {code, response} = await prepareResponseAsync({data: formattedResponse});
        res.status(code).send(response);
    },

    getAll: async (req: Request, res: Response) => {
        const {query} = req;

        const result = await getAllWorkbooks(
            {ctx: req.ctx},
            {
                page: (query.page && Number(query.page)) as number | undefined,
                pageSize: (query.pageSize && Number(query.pageSize)) as number | undefined,
            },
        );

        const formattedResponse = formatWorkbookModelsList(result);
        const {code, response} = await prepareResponseAsync({data: formattedResponse});
        res.status(code).send(response);
    },

    restore: async (req: Request, res: Response) => {
        const {params} = req;

        const result = await restoreWorkbook(
            {
                ctx: req.ctx,
            },
            {
                workbookId: params.workbookId,
            },
        );

        const formattedResponse = formatRestoreWorkbook(result);
        const {code, response} = await prepareResponseAsync({data: formattedResponse});
        res.status(code).send(response);
    },
};
