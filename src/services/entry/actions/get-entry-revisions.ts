import {NotExistEntryError} from '../../../components/errors';
import {makeSchemaValidator} from '../../../components/validation-schema-compiler';
import {zc} from '../../../components/zod';
import {DEFAULT_PAGE_SIZE, DEFAULT_QUERY_TIMEOUT, OrderBy} from '../../../const';
import Entry from '../../../db/models/entry';
import {EntryColumn} from '../../../db/models/new/entry';
import {RevisionModel, RevisionModelColumn} from '../../../db/models/new/revision';
import {CTX, DlsActions} from '../../../types/models';
import Utils from '../../../utils';
import {createPaginator} from '../../../utils/cursor-pagination';
import {
    CollectionEntryPermissions,
    checkCollectionEntryPermission,
} from '../../new/entry/collection-entry';
import {ServiceArgs} from '../../new/types';
import {getWorkbook} from '../../new/workbook';
import {ReturnNavigationColumnsEntry} from '../types';

import {checkEntry} from './check-entry';

export type EntryRevisionNavItem = ReturnNavigationColumnsEntry & {
    revId: string;
};

export type GetEntryRevisionsResult = {
    nextPageToken?: string;
    entries: EntryRevisionNavItem[];
};

const SORT_FIELD = `${RevisionModel.tableName}.${RevisionModelColumn.UpdatedAt}`;
const TIEBREAKER_FIELD = `${RevisionModel.tableName}.${RevisionModelColumn.RevId}`;

const GET_ENTRY_REVISIONS_RETURN_COLUMNS = [
    `${Entry.tableName}.${EntryColumn.EntryId}`,
    `${Entry.tableName}.${EntryColumn.Scope}`,
    `${Entry.tableName}.${EntryColumn.Type}`,
    `${Entry.tableName}.${EntryColumn.DisplayKey} as key`,
    `${Entry.tableName}.${EntryColumn.CreatedBy}`,
    `${Entry.tableName}.${EntryColumn.CreatedAt}`,
    `${Entry.tableName}.${EntryColumn.SavedId}`,
    `${Entry.tableName}.${EntryColumn.PublishedId}`,
    `${Entry.tableName}.${EntryColumn.Hidden}`,
    `${Entry.tableName}.${EntryColumn.WorkbookId}`,
    `${Entry.tableName}.${EntryColumn.CollectionId}`,
    `${RevisionModel.tableName}.${RevisionModelColumn.Meta}`,
    `${RevisionModel.tableName}.${RevisionModelColumn.UpdatedBy}`,
    `${RevisionModel.tableName}.${RevisionModelColumn.UpdatedAt}`,
    `${RevisionModel.tableName}.${RevisionModelColumn.Annotation}`,
    `${RevisionModel.tableName}.${RevisionModelColumn.RevId}`,
];

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
        throw new NotExistEntryError();
    }

    if (!isPrivateRoute) {
        if (!entry.workbookId) {
            await checkEntry(ctx, Entry.replica, {verifiableEntry: entry});
        }

        if (entry.workbookId) {
            await getWorkbook({ctx}, {workbookId: entry.workbookId});
        } else if (entry.collectionId) {
            await checkCollectionEntryPermission(
                {ctx},
                {entry, permission: CollectionEntryPermissions.Read},
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
        .select(GET_ENTRY_REVISIONS_RETURN_COLUMNS)
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

const GET_LEGACY_ENTRY_REVISIONS_RETURN_COLUMNS = [
    `${Entry.tableName}.${EntryColumn.EntryId}`,
    `${Entry.tableName}.${EntryColumn.Scope}`,
    `${Entry.tableName}.${EntryColumn.Type}`,
    `${Entry.tableName}.${EntryColumn.DisplayKey} as key`,
    `${Entry.tableName}.${EntryColumn.CreatedBy}`,
    `${Entry.tableName}.${EntryColumn.CreatedAt}`,
    `${Entry.tableName}.${EntryColumn.SavedId}`,
    `${Entry.tableName}.${EntryColumn.PublishedId}`,
    `${Entry.tableName}.${EntryColumn.TenantId}`,
    `${Entry.tableName}.${EntryColumn.Hidden}`,
    `${Entry.tableName}.${EntryColumn.Mirrored}`,
    `${Entry.tableName}.${EntryColumn.Public}`,
    `${Entry.tableName}.${EntryColumn.WorkbookId}`,
    `${Entry.tableName}.${EntryColumn.CollectionId}`,
    `${RevisionModel.tableName}.${RevisionModelColumn.RevId}`,
    `${RevisionModel.tableName}.${RevisionModelColumn.Data}`,
    `${RevisionModel.tableName}.${RevisionModelColumn.Meta}`,
    `${RevisionModel.tableName}.${RevisionModelColumn.Annotation}`,
    `${RevisionModel.tableName}.${RevisionModelColumn.UpdatedBy}`,
    `${RevisionModel.tableName}.${RevisionModelColumn.UpdatedAt}`,
    `${RevisionModel.tableName}.${RevisionModelColumn.Version}`,
    `${RevisionModel.tableName}.${RevisionModelColumn.SourceVersion}`,
];

export async function getLegacyEntryRevisions(ctx: CTX, {entryId}: GetLegacyEntryRevisionsData) {
    ctx.log('GET_LEGACY_REVISIONS_REQUEST', {
        entryId: Utils.encodeId(entryId),
    });

    validateGetLegacyEntryRevisions({entryId});

    await checkEntry(ctx, Entry.replica, {entryId});

    const entryRevisions = await Entry.query(Entry.replica)
        .select(GET_LEGACY_ENTRY_REVISIONS_RETURN_COLUMNS)
        .join('revisions', 'entries.entryId', 'revisions.entryId')
        .where({
            'entries.entryId': entryId,
            isDeleted: false,
        })
        .timeout(DEFAULT_QUERY_TIMEOUT);

    if (!entryRevisions.length) {
        throw new NotExistEntryError();
    }

    ctx.log('GET_LEGACY_REVISIONS_SUCCESS');

    return entryRevisions;
}
