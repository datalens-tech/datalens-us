import EntryService from '../services/entry.service';
import {Request, Response} from '@gravity-ui/expresskit';
import prepareResponse from '../components/response-presenter';
import Utils from '../utils';
import {US_MASTER_TOKEN_HEADER} from '../const';
import NavigationService from '../services/navigation.service';
import * as ST from '../types/services.types';
import {
    deleteEntry,
    DeleteEntryData,
    renameEntry,
    updateEntry,
    getEntryRevisions,
    GetEntryRevisionsData,
    getEntryRelations,
} from '../services/entry';
import {
    getEntry,
    GetEntryArgs,
    getEntryMeta,
    getEntryMetaPrivate,
    GetEntryMetaPrivateArgs,
    copyEntryToWorkbook,
} from '../services/new/entry';
import {
    formatGetEntryResponse,
    formatGetEntryMetaResponse,
    formatGetEntryMetaPrivateResponse,
    formatEntryModel,
} from '../services/new/entry/formatters';

export default {
    getEntry: async (req: Request, res: Response) => {
        const {query, params} = req;

        const result = await getEntry(
            {ctx: req.ctx},
            {
                entryId: params.entryId,
                branch: query.branch as GetEntryArgs['branch'],
                revId: query.revId as GetEntryArgs['revId'],
                includePermissionsInfo: Utils.isTrueArg(query.includePermissionsInfo),
                includeLinks: Utils.isTrueArg(query.includeLinks),
            },
        );
        const formattedResponse = formatGetEntryResponse(req.ctx, result);

        const {code, response} = prepareResponse({data: formattedResponse});

        res.status(code).send(response);
    },

    getEntryMeta: async (req: Request, res: Response) => {
        const {params, query} = req;

        const result = await getEntryMeta(
            {ctx: req.ctx},
            {
                entryId: params.entryId,
                branch: query.branch as any,
            },
        );
        const formattedResponse = formatGetEntryMetaResponse(result);

        const {code, response} = prepareResponse({data: formattedResponse});

        res.status(code).send(response);
    },

    getEntryMetaPrivate: async (req: Request, res: Response) => {
        const {params, query, headers} = req;
        const masterToken = headers[
            US_MASTER_TOKEN_HEADER
        ] as GetEntryMetaPrivateArgs['masterToken'];

        const result = await getEntryMetaPrivate(
            {ctx: req.ctx},
            {
                entryId: params.entryId,
                masterToken,
                branch: query.branch as any,
            },
        );
        const formattedResponse = formatGetEntryMetaPrivateResponse(result);

        const {code, response} = prepareResponse({data: formattedResponse});

        res.status(code).send(response);
    },

    getRevisions: async (req: Request, res: Response) => {
        const query = req.query;

        const result = await getEntryRevisions(
            {ctx: req.ctx},
            {
                entryId: req.params.entryId,
                page: (query.page && Number(query.page)) as GetEntryRevisionsData['page'],
                pageSize: (query.pageSize &&
                    Number(query.pageSize)) as GetEntryRevisionsData['pageSize'],
                revIds: query.revIds as GetEntryRevisionsData['revIds'],
                updatedAfter: query.updatedAfter as GetEntryRevisionsData['updatedAfter'],
            },
        );

        const {code, response} = prepareResponse({data: result});

        res.status(code).send(response);
    },

    createEntry: async (req: Request, res: Response) => {
        // const {body} = req;

        for (let i = 1; i < 1000; i++) {
            await EntryService.create({
                workbookId: '1466785678003012649',
                name: `New ${i}`,
                scope: 'dash',
                ctx: req.ctx,
            });
        }

        // const result = await EntryService.create({
        //     workbookId: body.workbookId,
        //     name: body.name,
        //     scope: body.scope,
        //     type: body.type,
        //     key: body.key,
        //     meta: body.meta,
        //     recursion: body.recursion,
        //     hidden: body.hidden,
        //     data: body.data,
        //     unversionedData: body.unversionedData,
        //     links: body.links,
        //     permissionsMode: body.permissionsMode,
        //     includePermissionsInfo: Utils.isTrueArg(body.includePermissionsInfo),
        //     initialPermissions: body.initialPermissions,
        //     initialParentId: body.initialParentId,
        //     ctx: req.ctx,
        // });

        // const {code, response} = prepareResponse({data: result});

        res.status(200).send({});
    },

    _createEntry: async (req: Request, res: Response) => {
        const {body} = req;

        const result = await EntryService._create({
            workbookId: body.workbookId,
            name: body.name,
            scope: body.scope,
            type: body.type,
            key: body.key,
            meta: body.meta,
            recursion: body.recursion,
            hidden: body.hidden,
            data: body.data,
            unversionedData: body.unversionedData,
            links: body.links,
            permissionsMode: body.permissionsMode,
            initialPermissions: body.initialPermissions,
            initialParentId: body.initialParentId,
            ctx: req.ctx,
        });

        const {code, response} = prepareResponse({data: result});

        res.status(code).send(response);
    },

    updateEntry: async (req: Request, res: Response) => {
        const {params, body} = req;

        const result = await updateEntry(req.ctx, {
            entryId: params.entryId,
            meta: body.meta,
            data: body.data,
            unversionedData: body.unversionedData,
            links: body.links,
            mode: body.mode,
            type: body.type,
            hidden: body.hidden,
            revId: body.revId,
            lockToken: body.lockToken,
            skipSyncLinks: body.skipSyncLinks,
        });

        const {code, response} = prepareResponse({data: result});

        res.status(code).send(response);
    },

    renameEntry: async (req: Request, res: Response) => {
        const {params, body} = req;

        const result = await renameEntry(req.ctx, {
            entryId: params.entryId,
            name: body.name,
        });

        const {code, response} = prepareResponse({data: result});

        res.status(code).send(response);
    },

    deleteEntry: async (req: Request, res: Response) => {
        const result = await deleteEntry(
            {ctx: req.ctx},
            {
                entryId: req.params.entryId,
                lockToken: req.query.lockToken as DeleteEntryData['lockToken'],
            },
        );

        const {code, response} = prepareResponse({data: result});
        res.status(code).send(response);
    },

    getRelations: async (req: Request, res: Response) => {
        const {params, query} = req;

        const result = await getEntryRelations(req.ctx, {
            entryId: params.entryId,
            direction: query.direction as Optional<string>,
            includePermissionsInfo: Utils.isTrueArg(query.includePermissionsInfo),
        });

        const {code, response} = prepareResponse({data: result});

        res.status(code).send(response);
    },

    copyEntryToWorkbook: async (req: Request, res: Response) => {
        const {params, body} = req;

        const result = await copyEntryToWorkbook(
            {ctx: req.ctx},
            {
                entryId: params.entryId,
                workbookId: body.workbookId,
                name: body.name,
            },
        );

        const formattedResponse = formatEntryModel(result);

        const {code, response} = prepareResponse({data: formattedResponse});
        res.status(code).send(response);
    },

    getEntries: async (req: Request, res: Response) => {
        const query = req.query as unknown as ST.GetEntries;

        const result = await NavigationService.getEntries({
            ids: query.ids,
            scope: query.scope,
            type: query.type,
            createdBy: query.createdBy,
            orderBy: query.orderBy,
            meta: query.meta,
            filters: query.filters,
            page: query.page && Number(query.page),
            pageSize: query.pageSize && Number(query.pageSize),
            includePermissionsInfo: Utils.isTrueArg(query.includePermissionsInfo),
            includeData: Utils.isTrueArg(query.includeData),
            includeLinks: Utils.isTrueArg(query.includeLinks),
            excludeLocked: Utils.isTrueArg(query.excludeLocked),
            ctx: req.ctx,
        });

        const {code, response} = prepareResponse({data: result});

        res.status(code).send(response);
    },
};
