import {AppError} from '@gravity-ui/nodekit';

import {Feature, isEnabledFeature} from '../../../components/features';
import {makeSchemaValidator} from '../../../components/validation-schema-compiler';
import {US_ERRORS} from '../../../const';
import OldEntry from '../../../db/models/entry';
import {Entry, EntryColumn} from '../../../db/models/new/entry';
import {TenantColumn} from '../../../db/models/new/tenant';
import {
    JoinedEntryRevisionFavoriteTenant,
    JoinedEntryRevisionFavoriteTenantColumns,
} from '../../../db/presentations';
import {DlsActions} from '../../../types/models';
import Utils from '../../../utils';
import {ServiceArgs} from '../types';
import {getReplica} from '../utils';
import {getWorkbook} from '../workbook';
import {getEntryPermissionsByWorkbook} from '../workbook/utils';

import {EntryPermissions} from './types';
import {checkFetchedEntry, checkWorkbookIsolation} from './utils';

const validateArgs = makeSchemaValidator({
    type: 'object',
    required: ['entryId', 'includePermissionsInfo', 'includeLinks'],
    properties: {
        entryId: {
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
        checkServicePlan: {
            type: 'string',
        },
    },
});

export interface GetEntryArgs {
    entryId: string;
    revId?: string;
    branch?: 'saved' | 'published';
    includePermissionsInfo: boolean;
    includeLinks: boolean;
    includeServicePlan?: boolean;
    includeTenantFeatures?: boolean;
}

export type GetEntryResult = {
    joinedEntryRevisionFavoriteTenant: JoinedEntryRevisionFavoriteTenantColumns;
    permissions: EntryPermissions;
    includePermissionsInfo: boolean;
    includeLinks: boolean;
    servicePlan?: string;
    includeServicePlan?: boolean;
    includeTenantFeatures?: boolean;
    tenantFeatures?: Record<string, unknown>;
};

// eslint-disable-next-line complexity
export const getEntry = async (
    {ctx, trx, skipValidation = false}: ServiceArgs,
    args: GetEntryArgs,
): Promise<GetEntryResult> => {
    const {
        entryId,
        revId,
        branch = 'saved',
        includePermissionsInfo,
        includeLinks,
        includeServicePlan,
        includeTenantFeatures,
    } = args;

    ctx.log('GET_ENTRY_REQUEST', {
        entryId: Utils.encodeId(entryId),
        revId,
        branch,
        includePermissionsInfo,
        includeLinks,
        includeServicePlan,
        includeTenantFeatures,
    });

    const registry = ctx.get('registry');
    const {DLS} = registry.common.classes.get();

    const {isPrivateRoute, user, onlyPublic, onlyMirrored} = ctx.get('info');

    if (!skipValidation) {
        validateArgs(args);
    }

    const {getEntryBeforeDbRequestHook, checkEmbedding} = registry.common.functions.get();

    await getEntryBeforeDbRequestHook({ctx, entryId});

    const isEmbedding = checkEmbedding({ctx});

    const joinedEntryRevisionFavoriteTenant = await JoinedEntryRevisionFavoriteTenant.findOne({
        where: (builder) => {
            builder.where({
                [`${Entry.tableName}.entryId`]: entryId,
                [`${Entry.tableName}.isDeleted`]: false,
            });

            if (revId) {
                builder.andWhere({revId});
            }

            if (onlyPublic) {
                builder.andWhere({public: true});
            }

            if (onlyMirrored) {
                builder.andWhere({mirrored: true});
            }
        },
        joinRevisionArgs: {
            revId,
            branch,
        },
        userLogin: user.login,
        trx: getReplica(trx),
    });

    if (joinedEntryRevisionFavoriteTenant) {
        const {isNeedBypassEntryByKey, getServicePlan} = registry.common.functions.get();

        const dlsBypassByKeyEnabled = isNeedBypassEntryByKey(
            ctx,
            joinedEntryRevisionFavoriteTenant.key as string,
        );

        let dlsPermissions: any; // TODO: Update the type after refactoring DLS.checkPermission(...)
        let iamPermissions: Optional<EntryPermissions>;

        if (joinedEntryRevisionFavoriteTenant.workbookId) {
            const checkWorkbookEnabled =
                !isPrivateRoute && !onlyPublic && !onlyMirrored && !isEmbedding;

            if (checkWorkbookEnabled) {
                if (isEnabledFeature(ctx, Feature.WorkbookIsolationEnabled)) {
                    checkWorkbookIsolation({
                        ctx,
                        workbookId: joinedEntryRevisionFavoriteTenant.workbookId,
                    });
                }

                const workbook = await getWorkbook(
                    {ctx, trx},
                    {
                        workbookId: joinedEntryRevisionFavoriteTenant.workbookId,
                        includePermissionsInfo,
                    },
                );

                if (includePermissionsInfo) {
                    iamPermissions = getEntryPermissionsByWorkbook({
                        workbook,
                        scope: joinedEntryRevisionFavoriteTenant[EntryColumn.Scope],
                    });
                }
            }
        } else {
            const checkPermissionEnabled =
                !dlsBypassByKeyEnabled &&
                !isPrivateRoute &&
                ctx.config.dlsEnabled &&
                !onlyPublic &&
                !onlyMirrored;

            const checkEntryEnabled =
                !isPrivateRoute && !onlyPublic && !onlyMirrored && !isEmbedding;

            if (checkPermissionEnabled) {
                dlsPermissions = await DLS.checkPermission(
                    {ctx, trx},
                    {
                        entryId,
                        action: DlsActions.Execute,
                        includePermissionsInfo,
                    },
                );
            }

            if (checkEntryEnabled) {
                if (isEnabledFeature(ctx, Feature.WorkbookIsolationEnabled)) {
                    checkWorkbookIsolation({
                        ctx,
                        workbookId: null,
                    });
                }

                await checkFetchedEntry(ctx, joinedEntryRevisionFavoriteTenant, getReplica(trx));
            }
        }

        let servicePlan: string | undefined;
        if (includeServicePlan) {
            servicePlan = getServicePlan(joinedEntryRevisionFavoriteTenant);
        }

        let tenantFeatures: Record<string, unknown> | undefined;

        if (includeTenantFeatures) {
            tenantFeatures = joinedEntryRevisionFavoriteTenant[TenantColumn.Features] || undefined;
        }

        let permissions: EntryPermissions = {};
        if (includePermissionsInfo) {
            permissions = OldEntry.originatePermissions({
                isPrivateRoute,
                shared: onlyPublic || isEmbedding,
                permissions: dlsPermissions,
                iamPermissions,
                ctx,
            });
        }

        ctx.log('GET_ENTRY_SUCCESS');

        return {
            joinedEntryRevisionFavoriteTenant,
            permissions,
            includePermissionsInfo,
            includeLinks,
            servicePlan,
            includeServicePlan,
            includeTenantFeatures,
            tenantFeatures,
        };
    } else {
        throw new AppError(US_ERRORS.NOT_EXIST_ENTRY, {
            code: US_ERRORS.NOT_EXIST_ENTRY,
        });
    }
};
