import {Request, Response} from '@gravity-ui/expresskit';

import {prepareResponseAsync} from '../../components/response-presenter';
import {US_MASTER_TOKEN_HEADER} from '../../const';
import {EntryScope} from '../../db/models/new/entry/types';
import {
    DeleteEntryData,
    GetEntryRevisionsData,
    RelationDirection,
    deleteEntry,
    getEntryRelations,
    getEntryRevisions,
    renameEntry,
    switchRevisionEntry,
    updateEntry,
} from '../../services/entry';
import EntryService from '../../services/entry.service';
import NavigationService from '../../services/navigation.service';
import {
    GetEntryArgs,
    GetEntryMetaPrivateArgs,
    copyEntriesToWorkbook,
    copyEntryToWorkbook,
    getEntry,
    getEntryMeta,
    getEntryMetaPrivate,
} from '../../services/new/entry';
import {
    formatEntryModel,
    formatGetEntryMetaPrivateResponse,
    formatGetEntryMetaResponse,
    formatGetEntryResponse,
} from '../../services/new/entry/formatters';
import * as ST from '../../types/services.types';
import Utils from '../../utils';

import {getEntriesData} from './getEntriesData';

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
        const formattedResponse = await formatGetEntryResponse(req.ctx, result);

        const {code, response} = await prepareResponseAsync({data: formattedResponse});

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

        const {code, response} = await prepareResponseAsync({data: formattedResponse});

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

        const {code, response} = await prepareResponseAsync({data: formattedResponse});

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

        const {code, response} = await prepareResponseAsync({data: result});

        res.status(code).send(response);
    },

    createEntry: async (req: Request, res: Response) => {
        const {body} = req;

        const result = await EntryService.create({
            workbookId: body.workbookId,
            name: body.name,
            scope: body.scope,
            type: body.type,
            key: body.key,
            meta: body.meta,
            recursion: body.recursion,
            hidden: body.hidden,
            mirrored: body.mirrored,
            mode: body.mode,
            data: body.data,
            unversionedData: body.unversionedData,
            links: body.links,
            permissionsMode: body.permissionsMode,
            includePermissionsInfo: Utils.isTrueArg(body.includePermissionsInfo),
            initialPermissions: body.initialPermissions,
            initialParentId: body.initialParentId,
            ctx: req.ctx,
        });

        const {code, response} = await prepareResponseAsync({data: result});

        res.status(code).send(response);
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
            mirrored: body.mirrored,
            mode: body.mode,
            data: body.data,
            unversionedData: body.unversionedData,
            links: body.links,
            permissionsMode: body.permissionsMode,
            initialPermissions: body.initialPermissions,
            initialParentId: body.initialParentId,
            ctx: req.ctx,
        });

        const {code, response} = await prepareResponseAsync({data: result});

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
            mirrored: body.mirrored,
            revId: body.revId,
            lockToken: body.lockToken,
            skipSyncLinks: body.skipSyncLinks,
            updateRevision: body.updateRevision,
        });

        const {code, response} = await prepareResponseAsync({data: result});

        res.status(code).send(response);
    },

    switchRevisionEntry: async (req: Request, res: Response) => {
        const {params, body} = req;

        const result = await switchRevisionEntry(
            {ctx: req.ctx},
            {
                entryId: params.entryId,
                revId: body.revId,
            },
        );

        const {code, response} = await prepareResponseAsync({data: result});

        res.status(code).send(response);
    },

    renameEntry: async (req: Request, res: Response) => {
        const {params, body} = req;

        const result = await renameEntry(req.ctx, {
            entryId: params.entryId,
            name: body.name,
        });

        const {code, response} = await prepareResponseAsync({data: result});

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

        const {code, response} = await prepareResponseAsync({data: result});
        res.status(code).send(response);
    },

    getRelations: async (req: Request, res: Response) => {
        const {params, query} = req;

        const result = await getEntryRelations(
            {ctx: req.ctx},
            {
                entryId: params.entryId,
                direction: query.direction as Optional<RelationDirection>,
                includePermissionsInfo: Utils.isTrueArg(query.includePermissionsInfo),
                page: (query.page && Number(query.page)) as number | undefined,
                pageSize: (query.pageSize && Number(query.pageSize)) as number | undefined,
                scope: query.scope as EntryScope | undefined,
            },
        );

        // TODO: leave a response with pagination only, when there will be pagination support everywhere in the frontend
        const formattedResponse =
            typeof query.page !== 'undefined' && typeof query.pageSize !== 'undefined'
                ? result
                : result.relations;

        const {code, response} = await prepareResponseAsync({data: formattedResponse});

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

        const {code, response} = await prepareResponseAsync({data: formattedResponse});
        res.status(code).send(response);
    },

    copyEntriesToWorkbook: async (req: Request, res: Response) => {
        const {body} = req;

        const result = await copyEntriesToWorkbook(
            {ctx: req.ctx},
            {
                entryIds: body.entryIds,
                workbookId: body.workbookId,
            },
        );

        const {code, response} = await prepareResponseAsync({data: result});
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
            ignoreWorkbookEntries: Utils.isTrueArg(query.ignoreWorkbookEntries),
            includeData: Utils.isTrueArg(query.includeData),
            includeLinks: Utils.isTrueArg(query.includeLinks),
            excludeLocked: Utils.isTrueArg(query.excludeLocked),
            ctx: req.ctx,
        });

        const {code, response} = await prepareResponseAsync({data: result});

        res.status(code).send(response);
    },

    getEntriesData,
};
