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
        ctx,
    }: ST.CreateEntry) {
        const {requestId, tenantId, user, dlContext, isPrivateRoute} = ctx.get('info');

        const registry = ctx.get('registry');
        const {checkTenant} = registry.common.functions.get();

        await checkTenant({
            ctx,
            tenantId,
            servicePlan: checkServicePlan,
            features: checkTenantFeatures,
            foldersEnabled: !workbookId,
        });

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
            },
            ctx,
        );
    }

    static async _create({
        workbookId,
        collectionId,
        name,
        scope,
        type,
        key,
        meta,
        recursion,
        hidden,
        mirrored,
        mode,
        data,
        description,
        annotation,
        unversionedData,
        links,
        permissionsMode,
        initialPermissions,
        initialParentId,
        checkServicePlan,
        checkTenantFeatures,
        ctx,
    }: ST.CreateEntry) {
        const {
            requestId,
            tenantId,
            dlContext,
            // TODO: Send isPrivateRoute. The issue is that the backend takes dl_config from the public and private APIs.
        } = ctx.get('info');

        const registry = ctx.get('registry');
        const {checkTenant} = registry.common.functions.get();

        await checkTenant({
            ctx,
            tenantId,
            servicePlan: checkServicePlan,
            features: checkTenantFeatures,
            foldersEnabled: !workbookId,
        });

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
                includePermissionsInfo: false,
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
                    includePermissionsInfo: false,
                },
            );
        }

        const requestedBy = {
            userId: SYSTEM_USER.ID,
            login: SYSTEM_USER.LOGIN,
        };

        return await Entry._create(
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
                requestedBy,
                data,
                description,
                annotation,
                unversionedData: unversionedData,
                links,
                permissionsMode,
                initialPermissions,
                initialParentId,
                dlContext,
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
