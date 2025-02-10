import {Request, Response} from '@gravity-ui/expresskit';

import {prepareResponseAsync} from '../../components/response-presenter';
import {US_MASTER_TOKEN_HEADER} from '../../const';
import {EntryScope} from '../../db/models/new/entry/types';
import {
    GetEntryRevisionsData,
    RelationDirection,
    getEntryRelations,
    getEntryRevisions,
    switchRevisionEntry,
} from '../../services/entry';
import NavigationService from '../../services/navigation.service';
import {
    GetEntryArgs,
    GetEntryMetaPrivateArgs,
    getEntry,
    getEntryMeta,
    getEntryMetaPrivate,
} from '../../services/new/entry';
import {
    formatGetEntryMetaPrivateResponse,
    formatGetEntryMetaResponse,
    formatGetEntryResponse,
} from '../../services/new/entry/formatters';
import * as ST from '../../types/services.types';
import {isTrueArg} from '../../utils/env-utils';

import {copyEntriesToWorkbook} from './copy-entries-to-workbook';
import {copyEntryToWorkbook} from './copy-entry-to-workbook';
import {createEntry} from './create-entry';
import {createEntryAlt} from './create-entry-alt';
import {deleteEntry} from './delete-entry';
import {getEntriesData} from './get-entries-data';
import {renameEntry} from './rename-entry';
import {updateEntry} from './update-entry';

export default {
    getEntriesData,
    deleteEntry,
    copyEntryToWorkbook,
    copyEntriesToWorkbook,
    renameEntry,
    updateEntry,
    createEntry,
    createEntryAlt,

    getEntry: async (req: Request, res: Response) => {
        const {query, params} = req;

        const result = await getEntry(
            {ctx: req.ctx},
            {
                entryId: params.entryId,
                branch: query.branch as GetEntryArgs['branch'],
                revId: query.revId as GetEntryArgs['revId'],
                includePermissionsInfo: isTrueArg(query.includePermissionsInfo),
                includeLinks: isTrueArg(query.includeLinks),
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

    getRelations: async (req: Request, res: Response) => {
        const {params, query} = req;

        const result = await getEntryRelations(
            {ctx: req.ctx},
            {
                entryId: params.entryId,
                direction: query.direction as Optional<RelationDirection>,
                includePermissionsInfo: isTrueArg(query.includePermissionsInfo),
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
            includePermissionsInfo: isTrueArg(query.includePermissionsInfo),
            ignoreWorkbookEntries: isTrueArg(query.ignoreWorkbookEntries),
            includeData: isTrueArg(query.includeData),
            includeLinks: isTrueArg(query.includeLinks),
            excludeLocked: isTrueArg(query.excludeLocked),
            ctx: req.ctx,
        });

        const {code, response} = await prepareResponseAsync({data: result});

        res.status(code).send(response);
    },
};
