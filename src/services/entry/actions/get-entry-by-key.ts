import {AppError} from '@gravity-ui/nodekit';
import Entry from '../../../db/models/entry';
import {Optional as OptionalFields} from 'utility-types';
import {CTX, DlsActions, RevisionColumns} from '../../../types/models';
import {RETURN_COLUMNS, DEFAULT_QUERY_TIMEOUT, US_ERRORS} from '../../../const';
import Utils from '../../../utils';
import {makeSchemaValidator} from '../../../components/validation-schema-compiler';
import {checkEntry} from './check-entry';

const validateGetEntryByKey = makeSchemaValidator({
    type: 'object',
    required: ['key'],
    properties: {
        key: {
            type: 'string',
        },
        revId: {
            type: 'string',
        },
        branch: {
            type: 'string',
            enum: ['saved', 'published'],
        },
        includePermissionsInfo: {
            type: 'boolean',
        },
        includeLinks: {
            type: 'boolean',
        },
    },
});

export type GetEntryByKeyData = {
    key: string;
    revId?: string;
    branch?: 'saved' | 'published';
    includePermissionsInfo?: boolean;
    includeLinks?: boolean;
    customErrorBypassEnabled?: boolean;
    customIsPrivateRoute?: boolean;
};

export async function getEntryByKey(
    ctx: CTX,
    {
        key,
        revId,
        branch = 'saved',
        includePermissionsInfo,
        includeLinks,
        customIsPrivateRoute = false,
        customErrorBypassEnabled = false,
    }: GetEntryByKeyData,
) {
    const registry = ctx.get('registry');
    const {tenantId, isPrivateRoute: infoIsPrivateRoute} = ctx.get('info');
    const isPrivateRoute = customIsPrivateRoute || infoIsPrivateRoute;

    ctx.log('GET_ENTRY_BY_KEY_REQUEST', {
        key,
        revId,
        branch,
        includePermissionsInfo,
        includeLinks,
        customIsPrivateRoute,
        customErrorBypassEnabled,
    });

    const {DLS} = registry.common.classes.get();

    validateGetEntryByKey({
        key,
        revId,
        branch,
        includePermissionsInfo,
        includeLinks,
    });

    const keyLowerCase = key && key.toLowerCase();

    const entry = (await Entry.query(Entry.replica)
        .select(includeLinks ? RETURN_COLUMNS.concat('links') : RETURN_COLUMNS)
        .join('revisions', (qb) => {
            if (revId) {
                qb.on('entries.entryId', 'revisions.entryId');
            } else if (branch === 'published') {
                qb.on('entries.publishedId', 'revisions.revId');
            } else {
                qb.on('entries.savedId', 'revisions.revId');
            }
        })
        .where((qb) => {
            qb.where({
                key: keyLowerCase,
                isDeleted: false,
                tenantId,
            });

            if (revId) {
                qb.andWhere({revId});
            }
        })
        .first()
        .timeout(DEFAULT_QUERY_TIMEOUT)) as OptionalFields<Entry, 'unversionedData'> &
        Pick<RevisionColumns, 'meta'>;

    if (!customErrorBypassEnabled && !entry) {
        throw new AppError(US_ERRORS.NOT_EXIST_ENTRY, {
            code: US_ERRORS.NOT_EXIST_ENTRY,
        });
    }

    if (entry) {
        await checkEntry(ctx, Entry.replica, {verifiableEntry: entry});
    }

    const {isNeedBypassEntryByKey} = registry.common.functions.get();

    const dlsBypassByKeyEnabled = isNeedBypassEntryByKey(ctx, key);
    let permissions;

    if (!dlsBypassByKeyEnabled && !isPrivateRoute && ctx.config.dlsEnabled && entry) {
        permissions = await DLS.checkPermission(
            {ctx},
            {
                entryId: entry.entryId,
                action: DlsActions.Read,
                includePermissionsInfo,
            },
        );
    }

    if (includePermissionsInfo && entry) {
        entry.permissions = Entry.originatePermissions({
            isPrivateRoute,
            permissions,
            iamPermissions: undefined,
            ctx,
        });
    }

    const {privatePermissions} = ctx.get('info');
    if (!privatePermissions.ownedScopes.includes(entry?.scope)) {
        delete entry?.unversionedData;
    }

    ctx.log('GET_ENTRY_BY_KEY_SUCCESS', {
        entryId: entry ? Utils.encodeId(entry.entryId) : null,
    });

    return entry;
}
