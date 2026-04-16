import {Request, Response} from '@gravity-ui/expresskit';

import {prepareResponseAsync} from '../../components/response-presenter';
import {US_MASTER_TOKEN_HEADER} from '../../const';
import {GetEntryMetaPrivateArgs, getEntryMeta, getEntryMetaPrivate} from '../../services/new/entry';
import {
    formatGetEntryMetaPrivateResponse,
    formatGetEntryMetaResponse,
} from '../../services/new/entry/formatters';

import {checkEntriesExistenceController} from './check-entries-existence';
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
import {getRelationsController} from './get-relations';
import {getRevisionsController} from './get-revisions';
import {renameEntryController} from './rename-entry';
import {switchRevisionEntryController} from './switch-revision-entry';
import {updateEntryController} from './update-entry';
import {updateEntryUnversionedDataPrivateController} from './update-entry-unversioned-data-private';

export default {
    checkEntriesExistenceController,
    getEntriesDataController,
    getEntriesMetaController,
    getEntriesAnnotationController,
    deleteEntryController,
    copyEntryToWorkbookController,
    copyEntriesToWorkbookController,
    renameEntryController,
    updateEntryController,
    updateEntryUnversionedDataPrivateController,
    createEntryController,
    getEntriesController,
    getEntryController,
    getEntriesRelationsController,
    switchRevisionEntryController,
    getRevisionsController,
    getRelationsController,

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
};
