import {SYSTEM_USER} from '../const';
import Entry from '../db/models/entry';
import {EntryScope} from '../db/models/new/entry/types';
import * as ST from '../types/services.types';

import {createEntryInWorkbook} from './entry';
import {createEntryInCollection} from './new/entry/create-in-collection';

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
    }: ST.CreateEntry) {
        const {requestId, tenantId, user, dlContext, isPrivateRoute} = ctx.get('info');

        const registry = ctx.get('registry');
        const {checkTenant, fetchAndValidateLicenseOrFail} = registry.common.functions.get();

        await Promise.all([
            checkTenant({
                ctx,
                tenantId,
                servicePlan: checkServicePlan,
                features: checkTenantFeatures,
                foldersEnabled: !workbookId,
            }),
            fetchAndValidateLicenseOrFail({ctx}),
        ]);

        if (workbookId) {
            return await createEntryInWorkbook(ctx, {
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
            });
        }

        if (collectionId) {
            return await createEntryInCollection(
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
            );
        }

        return await Entry.create(
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
        );
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
