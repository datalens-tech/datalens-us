import {AppError} from '@gravity-ui/nodekit';
import {checkFetchedEntry} from './utils';
import {EntryPermissions} from './types';
import {ServiceArgs} from '../types';
import {getReplica} from '../utils';
import {Entry, EntryColumn} from '../../../db/models/new/entry';
import {DlsActions} from '../../../types/models';
import {US_ERRORS} from '../../../const';
import Utils from '../../../utils';
import {makeSchemaValidator} from '../../../components/validation-schema-compiler';
import {JoinedEntryRevision} from '../../../db/presentations/joined-entry-revision';
import {RevisionModel} from '../../../db/models/new/revision';
import OldEntry from '../../../db/models/entry';
import {getWorkbook} from '../workbook';
import {getEntryPermissionsByWorkbook} from '../workbook/utils';
import {validateTenantId} from './validators';

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

export type GetEntryByKeyArgs = {
    key: string;
    revId?: string;
    branch?: 'saved' | 'published';
    includePermissionsInfo: boolean;
    includeLinks: boolean;
    customErrorBypassEnabled?: boolean;
    customIsPrivateRoute?: boolean;
};

export const getEntryByKey = async (
    {ctx, trx}: ServiceArgs,
    {
        key,
        revId,
        branch = 'saved',
        includePermissionsInfo,
        includeLinks,
        customIsPrivateRoute = false,
        customErrorBypassEnabled = false,
    }: GetEntryByKeyArgs,
) => {
    ctx.log('GET_ENTRY_BY_KEY_REQUEST', {
        key,
        revId,
        branch,
        includePermissionsInfo,
        includeLinks,
        customIsPrivateRoute,
        customErrorBypassEnabled,
    });

    const registry = ctx.get('registry');
    const {DLS} = registry.common.classes.get();

    const {tenantId, isPrivateRoute: infoIsPrivateRoute} = ctx.get('info');

    validateTenantId({
        tenantId,
    });

    validateGetEntryByKey({
        key,
        revId,
        branch,
        includePermissionsInfo,
        includeLinks,
    });

    const isPrivateRoute = customIsPrivateRoute || infoIsPrivateRoute;

    const keyLowerCase = key && key.toLowerCase();

    const joinedEntryRevision = await JoinedEntryRevision.findOne({
        where: (builder) => {
            builder.where({
                [`${Entry.tableName}.key`]: keyLowerCase,
                [`${Entry.tableName}.isDeleted`]: false,
                [`${Entry.tableName}.tenantId`]: tenantId,
            });

            if (revId) {
                builder.andWhere({[`${RevisionModel.tableName}.revId`]: revId});
            }
        },
        joinRevisionArgs: {
            revId,
            branch,
        },
        trx: getReplica(trx),
    });

    if (joinedEntryRevision) {
        let dlsPermissions: any; // TODO: Update the type after refactoring DLS.checkPermission(...)
        let iamPermissions: Optional<EntryPermissions>;

        if (joinedEntryRevision.workbookId) {
            if (!isPrivateRoute) {
                const workbook = await getWorkbook(
                    {ctx, trx},
                    {workbookId: joinedEntryRevision.workbookId, includePermissionsInfo},
                );

                if (includePermissionsInfo) {
                    iamPermissions = getEntryPermissionsByWorkbook({
                        ctx,
                        workbook,
                        scope: joinedEntryRevision[EntryColumn.Scope],
                    });
                }
            }
        } else {
            await checkFetchedEntry(ctx, joinedEntryRevision, getReplica(trx));

            const {isNeedBypassEntryByKey} = registry.common.functions.get();

            const dlsBypassByKeyEnabled = isNeedBypassEntryByKey(
                ctx,
                joinedEntryRevision.key as string,
            );

            if (!dlsBypassByKeyEnabled && !isPrivateRoute && ctx.config.dlsEnabled) {
                dlsPermissions = await DLS.checkPermission(
                    {ctx, trx},
                    {
                        entryId: joinedEntryRevision.entryId,
                        action: DlsActions.Read,
                        includePermissionsInfo,
                    },
                );
            }
        }

        let permissions: EntryPermissions = {};
        if (includePermissionsInfo) {
            permissions = OldEntry.originatePermissions({
                isPrivateRoute,
                permissions: dlsPermissions,
                iamPermissions,
                ctx,
            });
        }

        ctx.log('GET_ENTRY_BY_KEY_SUCCESS', {
            entryId: Utils.encodeId(joinedEntryRevision.entryId),
        });

        return {
            joinedEntryRevision,
            permissions,
            includePermissionsInfo,
            includeLinks,
        };
    } else if (customErrorBypassEnabled) {
        return undefined;
    } else {
        throw new AppError(US_ERRORS.NOT_EXIST_ENTRY, {
            code: US_ERRORS.NOT_EXIST_ENTRY,
        });
    }
};
