import {Request, Response} from '@gravity-ui/expresskit';
import prepareResponse from '../components/response-presenter';
import Utils from '../utils';
import {
    createWorkbook,
    getWorkbook,
    getWorkbookContent,
    getWorkbooksList,
    updateWorkbook,
    moveWorkbook,
    moveWorkbooksList,
    deleteWorkbook,
    setWorkbookIsTemplate,
    copyWorkbook,
    copyWorkbookTemplate,
    getAllWorkbooks,
    OrderField,
    OrderDirection,
    restoreWorkbook,
} from '../services/new/workbook';
import {
    formatWorkbookModel,
    formatWorkbookModelsList,
    formatWorkbook,
    formatWorkbookWithOperation,
    formatWorkbookModelWithOperation,
    formatWorkbooksList,
    formatSetWorkbookIsTemplate,
    formatRestoreWorkbook,
} from '../services/new/workbook/formatters';

export default {
    create: async (req: Request, res: Response) => {
        const {body} = req;

        const result = await createWorkbook(
            {
                ctx: req.ctx,
            },
            {
                collectionId: body.collectionId ?? null,
                title: body.title,
                description: body.description,
            },
        );

        const formattedResponse = formatWorkbookWithOperation(result.workbook, result.operation);
        const {code, response} = prepareResponse({data: formattedResponse});
        res.status(code).send(response);
    },

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
        const {code, response} = prepareResponse({data: formattedResponse});
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

        const {code, response} = prepareResponse({data: result});
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
        const {code, response} = prepareResponse({data: formattedResponse});
        res.status(code).send(response);
    },

    update: async (req: Request, res: Response) => {
        const {body, params} = req;

        const result = await updateWorkbook(
            {
                ctx: req.ctx,
            },
            {
                workbookId: params.workbookId,
                title: body.title,
                description: body.description,
            },
        );

        const formattedResponse = formatWorkbookModel(result);
        const {code, response} = prepareResponse({data: formattedResponse});
        res.status(code).send(response);
    },

    move: async (req: Request, res: Response) => {
        const {body, params} = req;

        const result = await moveWorkbook(
            {
                ctx: req.ctx,
            },
            {
                workbookId: params.workbookId,
                collectionId: body.collectionId,
                title: body.title,
            },
        );

        const formattedResponse = formatWorkbookModel(result);
        const {code, response} = prepareResponse({data: formattedResponse});
        res.status(code).send(response);
    },

    moveList: async (req: Request, res: Response) => {
        const {body} = req;

        const result = await moveWorkbooksList(
            {ctx: req.ctx},
            {
                workbookIds: body.workbookIds,
                collectionId: body.collectionId as string,
            },
        );

        const formattedResponse = formatWorkbookModelsList(result);

        const {code, response} = prepareResponse({data: formattedResponse});

        res.status(code).send(response);
    },

    delete: async (req: Request, res: Response) => {
        const {params} = req;

        await deleteWorkbook(
            {
                ctx: req.ctx,
            },
            {
                workbookId: params.workbookId,
            },
        );

        const {code, response} = prepareResponse({data: {status: 'ok'}});

        res.status(code).send(response);
    },

    copy: async (req: Request, res: Response) => {
        const {body, params} = req;

        const result = await copyWorkbook(
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
        const {code, response} = prepareResponse({data: formattedResponse});
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
        const {code, response} = prepareResponse({data: formattedResponse});
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
        const {code, response} = prepareResponse({data: formattedResponse});
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
        const {code, response} = prepareResponse({data: formattedResponse});
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
        const {code, response} = prepareResponse({data: formattedResponse});
        res.status(code).send(response);
    },
};
