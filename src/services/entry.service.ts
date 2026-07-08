import {ComputeEntriesFeatureDisabledError} from '../components/errors';
import {Feature, isEnabledFeature} from '../components/features';
import {SYSTEM_USER} from '../const';
import Entry from '../db/models/entry';
import {EntryScope} from '../db/models/new/entry/types';
import {Operation} from '../entities/types';
import {RevisionColumns, UsPermission} from '../types/models';
import * as ST from '../types/services.types';

import {createEntryInWorkbook} from './entry';
import {EntryWithRevisionResult} from './entry/types';
import {createEntryInCollection} from './new/entry/create-in-collection';
import {checkPrivateScopeAccess} from './new/entry/utils';

export type CreatedEntry = EntryWithRevisionResult & {
    links?: RevisionColumns['links'];
    permissions?: UsPermission;
    operation?: Operation;
};

export default class EntryService {
    static async _getEntriesByKey({key, branch, ctx}: ST.PrivateGetEntriesByKey) {
        const requestedBy = {
            userId: SYSTEM_USER.ID,
            login: SYSTEM_USER.LOGIN,
        };

        return await Entry._getEntriesByKey(
            {
                key,
                branch,
                requestedBy,
            },
            ctx,
        );
    }

    static async create({
        workbookId,
        collectionId,
        name,
        scope,
        type,
        key,
        meta,
        description,
        annotation,
        recursion,
        hidden,
        mirrored,
        mode,
        data,
        unversionedData,
        links,
        permissionsMode,
        includePermissionsInfo,
        initialPermissions,
        initialParentId,
        checkServicePlan,
        checkTenantFeatures,
        version,
        sourceVersion,
        ctx,
    }: ST.CreateEntry): Promise<CreatedEntry | CreatedEntry[]> {
        const {requestId, tenantId, user, dlContext, isPrivateRoute} = ctx.get('info');

        const registry = ctx.get('registry');
        const {checkTenant, fetchAndValidateLicenseOrFail} = registry.common.functions.get();

        await Promise.all([
            checkTenant({
                ctx,
                tenantId,
                servicePlan: checkServicePlan,
                features: checkTenantFeatures,
                foldersEnabled: !workbookId && !collectionId,
            }),
            ...(isPrivateRoute ? [] : [fetchAndValidateLicenseOrFail({ctx})]),
        ]);

        checkPrivateScopeAccess({ctx}, scope ?? '');

        if (scope === EntryScope.Compute) {
            if (!isEnabledFeature(ctx, Feature.ComputeEntriesEnabled)) {
                throw new ComputeEntriesFeatureDisabledError();
            }
        }

        if (workbookId) {
            return (await createEntryInWorkbook(ctx, {
                workbookId,
                name: name as string,
                scope,
                type,
                links,
                hidden,
                mirrored,
                mode,
                unversionedData,
                meta,
                data,
                description,
                annotation,
                includePermissionsInfo,
                version,
                sourceVersion,
            })) as unknown as CreatedEntry;
        }

        if (collectionId) {
            return (await createEntryInCollection(
                {ctx},
                {
                    collectionId,
                    name: name as string,
                    scope: scope as EntryScope,
                    type,
                    links,
                    hidden,
                    mirrored,
                    mode,
                    unversionedData,
                    meta,
                    data,
                    description,
                    annotation,
                    includePermissionsInfo,
                    version,
                    sourceVersion,
                },
            )) as unknown as CreatedEntry;
        }

        return (await Entry.create(
            {
                requestId,
                tenantId,
                scope,
                type,
                key,
                meta,
                recursion,
                hidden,
                mirrored,
                mode,
                requestedBy: user,
                data,
                description,
                annotation,
                unversionedData,
                links,
                permissionsMode,
                includePermissionsInfo,
                initialPermissions,
                initialParentId,
                isPrivateRoute,
                dlContext,
                version,
                sourceVersion,
            },
            ctx,
        )) as unknown as CreatedEntry | CreatedEntry[];
    }

    static async resolveTenantIdByEntryId({entryId, ctx}: ST.ResolveTenantIdByEntryId) {
        const {requestId, tenantId, user} = ctx.get('info');

        return await Entry.resolveTenantIdByEntryId(
            {
                requestId,
                tenantId,
                entryId,
                requestedBy: user,
            },
            ctx,
        );
    }
}
