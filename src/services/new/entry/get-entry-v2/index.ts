import {AppError} from '@gravity-ui/nodekit';

import {Feature, isEnabledFeature} from '../../../../components/features';
import {US_ERRORS} from '../../../../const';
import OldEntry from '../../../../db/models/entry';
import {Entry, EntryColumn} from '../../../../db/models/new/entry';
import {TenantColumn} from '../../../../db/models/new/tenant';
import {DlsActions} from '../../../../types/models';
import Utils, {withTimeout} from '../../../../utils';
import {ServiceArgs} from '../../types';
import {getReplica} from '../../utils';
import {EntryPermissions} from '../types';
import {checkWorkbookIsolation} from '../utils';

import {
    selectedEntryColumns,
    selectedFavoriteColumns,
    selectedRevisionColumns,
    selectedTenantColumns,
} from './constants';
import type {SelectedEntry, SelectedRevision} from './types';
import {checkWorkbookEntry} from './utils';

const ENTRY_QUERY_TIMEOUT = 3000;

interface GetEntryV2Args {
    entryId: string;
    revId?: string;
    branch?: 'saved' | 'published';
    includePermissionsInfo?: boolean;
    includeLinks?: boolean;
    includeServicePlan?: boolean;
    includeTenantFeatures?: boolean;
    includeFavorite?: boolean;
    includeTenantSettings?: boolean;
}

export type GetEntryV2Result = {
    entry: SelectedEntry;
    revision: SelectedRevision;
    includePermissionsInfo?: boolean;
    permissions: EntryPermissions;
    includeLinks?: boolean;
    includeServicePlan?: boolean;
    servicePlan?: string;
    tenantFeatures?: Record<string, unknown>;
    includeTenantFeatures?: boolean;
    includeFavorite?: boolean;
    includeTenantSettings?: boolean;
    tenantSettings?: Record<string, unknown>;
};

// eslint-disable-next-line complexity
export const getEntryV2 = async (
    {ctx, trx}: ServiceArgs,
    args: GetEntryV2Args,
): Promise<GetEntryV2Result> => {
    const {
        entryId,
        revId,
        branch = 'saved',
        includePermissionsInfo,
        includeLinks,
        includeServicePlan,
        includeTenantFeatures,
        includeFavorite,
        includeTenantSettings,
    } = args;

    ctx.log('GET_ENTRY_V2_REQUEST', {
        entryId: Utils.encodeId(entryId),
        revId: Utils.encodeId(revId),
        branch,
        includePermissionsInfo,
        includeLinks,
        includeServicePlan,
        includeTenantFeatures,
        includeFavorite,
        includeTenantSettings,
    });

    const registry = ctx.get('registry');
    const {DLS} = registry.common.classes.get();

    const {isPrivateRoute, user, onlyPublic, onlyMirrored, tenantId} = ctx.get('info');

    const {getEntryBeforeDbRequestHook, checkEmbedding, getEntryResolveUserLogin} =
        registry.common.functions.get();

    let userLoginPromise: Promise<string | undefined> = Promise.resolve(undefined);

    if (includeFavorite) {
        userLoginPromise = user.login
            ? Promise.resolve(user.login)
            : getEntryResolveUserLogin({ctx});
    }

    const [userLogin] = await Promise.all([
        userLoginPromise,
        getEntryBeforeDbRequestHook({ctx, entryId}),
    ]);

    const isEmbedding = checkEmbedding({ctx});

    const graphRelations = ['workbook', 'tenant(tenantModifier)'];

    if (revId) {
        graphRelations.push('revisions(revisionsModifier)');
    } else if (branch === 'saved') {
        graphRelations.push('savedRevision(revisionModifier)');
    } else {
        graphRelations.push('publishedRevision(revisionModifier)');
    }

    if (includeFavorite && userLogin) {
        graphRelations.push('favorite(favoriteModifier)');
    }

    const checkEntryTenantEnabled = !isPrivateRoute && !onlyPublic && !onlyMirrored && !isEmbedding;

    const entry: SelectedEntry | undefined = await Entry.query(getReplica(trx))
        .select(selectedEntryColumns)
        .where((builder) => {
            builder.where({
                [`${Entry.tableName}.${EntryColumn.EntryId}`]: entryId,
                [`${Entry.tableName}.${EntryColumn.IsDeleted}`]: false,
                ...(checkEntryTenantEnabled
                    ? {
                          [`${Entry.tableName}.${EntryColumn.TenantId}`]: tenantId,
                      }
                    : {}),
            });

            if (onlyPublic) {
                builder.andWhere({public: true});
            }

            if (onlyMirrored) {
                builder.andWhere({mirrored: true});
            }
        })
        .withGraphJoined(`[${graphRelations.join(', ')}]`)
        .modifiers({
            tenantModifier(builder) {
                builder.select(selectedTenantColumns);
            },

            revisionsModifier(builder) {
                builder.select(selectedRevisionColumns).where({revId});
            },

            revisionModifier(builder) {
                builder.select(selectedRevisionColumns);
            },

            favoriteModifier(builder) {
                builder.select(selectedFavoriteColumns).where({login: userLogin});
            },
        })
        .first()
        .timeout(ENTRY_QUERY_TIMEOUT);

    const revision = entry?.publishedRevision ?? entry?.savedRevision ?? entry?.revisions?.[0];

    if (!entry || !revision) {
        throw new AppError(US_ERRORS.NOT_EXIST_ENTRY, {
            code: US_ERRORS.NOT_EXIST_ENTRY,
        });
    }

    if (!entry.tenant) {
        throw new AppError(US_ERRORS.NOT_EXIST_TENANT, {
            code: US_ERRORS.NOT_EXIST_TENANT,
        });
    }

    const checkWorkbookIsolationEnabled =
        !isPrivateRoute &&
        !onlyPublic &&
        !onlyMirrored &&
        !isEmbedding &&
        isEnabledFeature(ctx, Feature.WorkbookIsolationEnabled);

    if (checkWorkbookIsolationEnabled) {
        checkWorkbookIsolation({
            ctx,
            workbookId: entry.workbookId,
        });
    }

    const {isNeedBypassEntryByKey, getServicePlan} = registry.common.functions.get();

    const dlsBypassByKeyEnabled = isNeedBypassEntryByKey(ctx, entry.key as string);

    let dlsPermissions: any; // TODO: Update the type after refactoring DLS.checkPermission(...)
    let iamPermissions: Optional<EntryPermissions>;

    if (entry.workbookId) {
        if (!entry.workbook) {
            throw new AppError(US_ERRORS.WORKBOOK_NOT_EXISTS, {
                code: US_ERRORS.WORKBOOK_NOT_EXISTS,
            });
        }

        if (entry.tenantId !== entry.workbook.tenantId) {
            throw new AppError(US_ERRORS.ENTRY_AND_WORKBOOK_TENANT_MISMATCH, {
                code: US_ERRORS.ENTRY_AND_WORKBOOK_TENANT_MISMATCH,
            });
        }

        const checkWorkbookEnabled =
            !isPrivateRoute && !onlyPublic && !onlyMirrored && !isEmbedding;

        if (checkWorkbookEnabled) {
            iamPermissions = await checkWorkbookEntry({
                ctx,
                trx,
                entry,
                workbook: entry.workbook,
                includePermissionsInfo,
            });
        }
    } else {
        const checkPermissionEnabled =
            !dlsBypassByKeyEnabled &&
            !isPrivateRoute &&
            ctx.config.dlsEnabled &&
            !onlyPublic &&
            !onlyMirrored;

        if (checkPermissionEnabled) {
            dlsPermissions = await withTimeout(
                DLS.checkPermission(
                    {ctx, trx},
                    {
                        entryId,
                        action: DlsActions.Execute,
                        includePermissionsInfo,
                    },
                ),
                {timeoutMs: 3000, errorMessage: 'DLS.checkPermission timeout'},
            );
        }
    }

    let servicePlan: string | undefined;
    if (includeServicePlan) {
        servicePlan = getServicePlan(entry.tenant);
    }

    let tenantFeatures: Record<string, unknown> | undefined;
    if (includeTenantFeatures) {
        tenantFeatures = entry.tenant[TenantColumn.Features] || undefined;
    }

    let tenantSettings: Record<string, unknown> | undefined;
    if (includeTenantSettings) {
        tenantSettings = entry.tenant[TenantColumn.Settings] || undefined;
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

    ctx.log('GET_ENTRY_V2_SUCCESS');

    return {
        entry,
        revision,
        includePermissionsInfo,
        permissions,
        includeLinks,
        includeServicePlan,
        servicePlan,
        includeTenantFeatures,
        tenantFeatures,
        includeFavorite,
        includeTenantSettings,
        tenantSettings,
    };
};
