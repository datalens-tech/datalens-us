import {AppError} from '@gravity-ui/nodekit';
import {makeSchemaValidator} from '../../../components/validation-schema-compiler';
import Entry from '../../../db/models/entry';
import {CTX, DlsActions} from '../../../types/models';
import {
    RETURN_NAVIGATION_COLUMNS,
    RETURN_COLUMNS,
    DEFAULT_QUERY_TIMEOUT,
    US_ERRORS,
    DEFAULT_PAGE,
    DEFAULT_PAGE_SIZE,
} from '../../../const';
import Utils from '../../../utils';
import {checkEntry} from './check-entry';
import {getWorkbook} from '../../new/workbook';
import {ServiceArgs} from '../../new/types';
import {registry} from '../../../registry';

const validateArgs = makeSchemaValidator({
    type: 'object',
    required: ['entryId'],
    properties: {
        entryId: {
            type: 'string',
        },
        page: {
            type: 'number',
            minimum: 0,
        },
        pageSize: {
            type: 'number',
            minimum: 1,
            maximum: 200,
        },
        revIds: {
            oneOf: [
                {type: 'string'},
                {
                    type: 'array',
                    items: {type: 'string'},
                },
            ],
        },
        updatedAfter: {
            type: 'string',
        },
    },
});

export type GetEntryRevisionsData = {
    entryId: string;
    page?: number;
    pageSize?: number;
    revIds?: string | string[];
    updatedAfter?: string;
};

export async function getEntryRevisions(
    {ctx, skipValidation = false}: ServiceArgs,
    args: GetEntryRevisionsData,
) {
    const {entryId, page = DEFAULT_PAGE, pageSize = DEFAULT_PAGE_SIZE, revIds, updatedAfter} = args;

    ctx.log('GET_REVISIONS_REQUEST', {
        entryId: Utils.encodeId(entryId),
        page,
        pageSize,
    });

    const {DLS} = registry.common.classes.get();

    if (!skipValidation) {
        validateArgs(args);
    }

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

    if (entry.workbookId) {
        if (!isPrivateRoute) {
            await getWorkbook(
                {ctx},
                {
                    workbookId: entry.workbookId,
                },
            );
        }
    } else if (!isPrivateRoute) {
        await checkEntry(ctx, Entry.replica, {verifiableEntry: entry});

        if (ctx.config.dlsEnabled) {
            await DLS.checkPermission(
                {ctx},
                {
                    entryId,
                    action: DlsActions.Read,
                },
            );
        }
    }

    const entryRevisions = await Entry.query(Entry.replica)
        .select([...RETURN_NAVIGATION_COLUMNS, 'revId'])
        .join('revisions', 'entries.entryId', 'revisions.entryId')
        .where({
            'entries.entryId': entryId,
            isDeleted: false,
        })
        .where((builder) => {
            if (revIds) {
                builder.whereIn('revId', Array.isArray(revIds) ? revIds : [revIds]);
            }
            if (updatedAfter) {
                builder.where('revisions.updatedAt', '>=', updatedAfter);
            }
        })
        .orderBy('revisions.updatedAt', 'desc')
        .limit(pageSize)
        .offset(pageSize * page)
        .timeout(DEFAULT_QUERY_TIMEOUT);

    ctx.log('GET_REVISIONS_SUCCESS');

    return {
        nextPageToken: Utils.getOptimisticNextPageToken({
            page,
            pageSize,
            curPage: entryRevisions,
        }),
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
