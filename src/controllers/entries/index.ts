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
import {GetEntryMetaPrivateArgs, getEntryMeta, getEntryMetaPrivate} from '../../services/new/entry';
import {
    formatGetEntryMetaPrivateResponse,
    formatGetEntryMetaResponse,
} from '../../services/new/entry/formatters';
import {isTrueArg} from '../../utils/env-utils';

import {copyEntriesToWorkbookController} from './copy-entries-to-workbook';
import {copyEntryToWorkbookController} from './copy-entry-to-workbook';
import {createEntryController} from './create-entry';
import {deleteEntryController} from './delete-entry';
import {getEntriesController} from './get-entries';
import {getEntriesAnnotationController} from './get-entries-annotation';
import {getEntriesDataController} from './get-entries-data';
import {getEntriesMetaController} from './get-entries-meta';
import {getEntriesRelationsController} from './get-entries-relations';
import {getEntryController} from './get-entry';
import {renameEntryController} from './rename-entry';
import {updateEntryController} from './update-entry';

export default {
    getEntriesDataController,
    getEntriesMetaController,
    getEntriesAnnotationController,
    deleteEntryController,
    copyEntryToWorkbookController,
    copyEntriesToWorkbookController,
    renameEntryController,
    updateEntryController,
    createEntryController,
    getEntriesController,
    getEntryController,
    getEntriesRelationsController,

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
};
