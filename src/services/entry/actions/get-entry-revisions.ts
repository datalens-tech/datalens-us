import {AppError} from '@gravity-ui/nodekit';

import {makeSchemaValidator} from '../../../components/validation-schema-compiler';
import {zc} from '../../../components/zod';
import {
    DEFAULT_PAGE_SIZE,
    DEFAULT_QUERY_TIMEOUT,
    OrderBy,
    RETURN_COLUMNS,
    RETURN_NAVIGATION_COLUMNS,
    US_ERRORS,
} from '../../../const';
import Entry from '../../../db/models/entry';
import {EntryScope} from '../../../db/models/new/entry/types';
import {RevisionModel, RevisionModelColumn} from '../../../db/models/new/revision';
import {SharedEntryPermission} from '../../../entities/shared-entry';
import {CTX, DlsActions} from '../../../types/models';
import Utils from '../../../utils';
import {createPaginator} from '../../../utils/cursor-pagination';
import {checkSharedEntryPermission} from '../../new/entry/utils/check-collection-entry-permission/check-permission';
import {ServiceArgs} from '../../new/types';
import {getWorkbook} from '../../new/workbook';

import {checkEntry} from './check-entry';

export type EntryRevisionNavItem = {
    entryId: string;
    scope: EntryScope;
    type: string;
    key: string;
    meta: Record<string, unknown> | null;
    createdBy: string;
    createdAt: string;
    updatedBy: string;
    updatedAt: string;
    annotation: Record<string, unknown> | null;
    savedId: string | null;
    publishedId: string | null;
    revId: string;
    hidden: boolean;
    workbookId: string | null;
    collectionId: string | null;
};

export type GetEntryRevisionsResult = {
    nextPageToken?: string;
    entries: EntryRevisionNavItem[];
};

const SORT_FIELD = `${RevisionModel.tableName}.${RevisionModelColumn.UpdatedAt}`;
const TIEBREAKER_FIELD = `${RevisionModel.tableName}.${RevisionModelColumn.RevId}`;

export type GetEntryRevisionsData = {
    entryId: string;
    page?: string;
    pageSize?: number;
    revIds?: string[];
    updatedAfter?: string;
};

export async function getEntryRevisions(
    {ctx}: ServiceArgs,
    args: GetEntryRevisionsData,
): Promise<GetEntryRevisionsResult> {
    const {entryId, page, pageSize = DEFAULT_PAGE_SIZE, revIds, updatedAfter} = args;

    ctx.log('GET_REVISIONS_REQUEST', {
        entryId: Utils.encodeId(entryId),
        page,
        pageSize,
    });

    const registry = ctx.get('registry');
    const {DLS} = registry.common.classes.get();

    const {isPrivateRoute} = ctx.get('info');

    const entry = await Entry.query(Entry.replica)
        .select()
        .where({entryId})
        .first()
        .timeout(DEFAULT_QUERY_TIMEOUT);

    if (!entry) {
        throw new AppError(US_ERRORS.NOT_EXIST_ENTRY, {
            code: US_ERRORS.NOT_EXIST_ENTRY,
        });
    }

    if (!isPrivateRoute) {
        if (!entry.workbookId) {
            await checkEntry(ctx, Entry.replica, {verifiableEntry: entry});
        }

        if (entry.workbookId) {
            await getWorkbook({ctx}, {workbookId: entry.workbookId});
        } else if (entry.collectionId) {
            await checkSharedEntryPermission(
                {ctx},
                {entry, permission: SharedEntryPermission.View},
            );
        } else if (ctx.config.dlsEnabled) {
            await DLS.checkPermission({ctx}, {entryId, action: DlsActions.Read});
        }
    }

    const paginator = createPaginator({
        sortFields: [
            {field: SORT_FIELD, direction: OrderBy.Desc, validate: zc.stringSqlTimestampz()},
        ],
        tiebreakerField: {
            field: TIEBREAKER_FIELD,
            direction: OrderBy.Desc,
            validate: zc.stringBigInt(),
        },
        limit: pageSize,
        pageToken: page,
    });

    const query = Entry.query(Entry.replica)
        .select([...RETURN_NAVIGATION_COLUMNS, 'revisions.revId'])
        .join('revisions', 'entries.entryId', 'revisions.entryId')
        .where({
            'entries.entryId': entryId,
            isDeleted: false,
        })
        .where((builder) => {
            if (revIds) {
                builder.whereIn('revisions.revId', revIds);
            }
            if (updatedAfter) {
                builder.where('revisions.updatedAt', '>=', updatedAfter);
            }
        })
        .timeout(DEFAULT_QUERY_TIMEOUT);

    const {result, nextPageToken} = await paginator.execute(query);
    const entryRevisions = result as unknown as EntryRevisionNavItem[];

    ctx.log('GET_REVISIONS_SUCCESS');

    return {
        nextPageToken,
        entries: entryRevisions,
    };
}

const validateGetLegacyEntryRevisions = makeSchemaValidator({
    type: 'object',
    required: ['entryId'],
    properties: {
        entryId: {
            type: 'string',
        },
    },
});

type GetLegacyEntryRevisionsData = {
    entryId: string;
};

export async function getLegacyEntryRevisions(ctx: CTX, {entryId}: GetLegacyEntryRevisionsData) {
    ctx.log('GET_LEGACY_REVISIONS_REQUEST', {
        entryId: Utils.encodeId(entryId),
    });

    validateGetLegacyEntryRevisions({entryId});

    await checkEntry(ctx, Entry.replica, {entryId});

    const entryRevisions = await Entry.query(Entry.replica)
        .select(RETURN_COLUMNS)
        .join('revisions', 'entries.entryId', 'revisions.entryId')
        .where({
            'entries.entryId': entryId,
            isDeleted: false,
        })
        .timeout(DEFAULT_QUERY_TIMEOUT);

    if (!entryRevisions.length) {
        throw new AppError(US_ERRORS.NOT_EXIST_ENTRY, {
            code: US_ERRORS.NOT_EXIST_ENTRY,
        });
    }

    ctx.log('GET_LEGACY_REVISIONS_SUCCESS');

    return entryRevisions;
}
