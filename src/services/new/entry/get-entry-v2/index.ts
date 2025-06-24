import {AppError} from '@gravity-ui/nodekit';

import {Feature, isEnabledFeature} from '../../../../components/features';
import {US_ERRORS} from '../../../../const';
import OldEntry from '../../../../db/models/entry';
import {Entry} from '../../../../db/models/new/entry';
import {RevisionModel} from '../../../../db/models/new/revision';
import {TenantColumn} from '../../../../db/models/new/tenant';
import {DlsActions} from '../../../../types/models';
import Utils from '../../../../utils';
import {ServiceArgs} from '../../types';
import {getReplica} from '../../utils';
import {EntryPermissions} from '../types';
import {checkFetchedEntry, checkWorkbookIsolation} from '../utils';

import {
    selectedEntryColumns,
    selectedFavoriteColumns,
    selectedRevisionColumns,
    selectedTenantColumns,
} from './constants';
import {checkWorkbookEntry} from './utils';

interface GetEntryNextArgs {
    entryId: string;
    revId?: string;
    branch?: 'saved' | 'published';
    includePermissionsInfo?: boolean;
    includeLinks?: boolean;
    includeServicePlan?: boolean;
    includeTenantFeatures?: boolean;
    includeFavorite?: boolean;
}

export type GetEntryNextResult = {
    entry: Entry;
    revision: RevisionModel;
    includePermissionsInfo?: boolean;
    permissions: EntryPermissions;
    includeLinks?: boolean;
    includeServicePlan?: boolean;
    servicePlan?: string;
    tenantFeatures?: Record<string, unknown>;
    includeTenantFeatures?: boolean;
    includeFavorite?: boolean;
};

// eslint-disable-next-line complexity
export const getEntryV2 = async (
    {ctx, trx}: ServiceArgs,
    args: GetEntryNextArgs,
): Promise<GetEntryNextResult> => {
    const {
        entryId,
        revId,
        branch = 'saved',
        includePermissionsInfo,
        includeLinks,
        includeServicePlan,
        includeTenantFeatures,
        includeFavorite,
    } = args;

    ctx.log('GET_ENTRY_REQUEST', {
        entryId: Utils.encodeId(entryId),
        revId: Utils.encodeId(revId),
        branch,
        includePermissionsInfo,
        includeLinks,
        includeServicePlan,
        includeTenantFeatures,
        includeFavorite,
    });

    const registry = ctx.get('registry');
    const {DLS} = registry.common.classes.get();

    const {isPrivateRoute, user, onlyPublic, onlyMirrored} = ctx.get('info');

    const {getEntryBeforeDbRequestHook, checkEmbedding, getEntryResolveUserLogin} =
        registry.common.functions.get();

    let userLoginPromise;
    if (includeFavorite) {
        userLoginPromise = user.login ? user.login : getEntryResolveUserLogin({ctx});
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

    const entry = await Entry.query(getReplica(trx))
        .select(selectedEntryColumns)
        .where((builder) => {
            builder.where({
                [`${Entry.tableName}.entryId`]: entryId,
                [`${Entry.tableName}.isDeleted`]: false,
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
        .timeout(Entry.DEFAULT_QUERY_TIMEOUT);

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

    const {isNeedBypassEntryByKey, getServicePlan} = registry.common.functions.get();

    const dlsBypassByKeyEnabled = isNeedBypassEntryByKey(ctx, entry.key as string);

    let dlsPermissions: any; // TODO: Update the type after refactoring DLS.checkPermission(...)
    let iamPermissions: Optional<EntryPermissions>;

    if (entry.workbook) {
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
            dlsPermissions = await DLS.checkPermission(
                {ctx, trx},
                {
                    entryId,
                    action: DlsActions.Execute,
                    includePermissionsInfo,
                },
            );
        }

        const checkEntryEnabled = !isPrivateRoute && !onlyPublic && !onlyMirrored && !isEmbedding;

        if (checkEntryEnabled) {
            if (isEnabledFeature(ctx, Feature.WorkbookIsolationEnabled)) {
                checkWorkbookIsolation({
                    ctx,
                    workbookId: null,
                });
            }

            await checkFetchedEntry(ctx, entry, getReplica(trx));
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
    };
};
