import {SYSTEM_USER} from '../const';
import Entry from '../db/models/entry';
import * as ST from '../types/services.types';

import {createEntryInWorkbook} from './entry';

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
        unversionedData,
        links,
        permissionsMode,
        includePermissionsInfo,
        initialPermissions,
        initialParentId,
        ctx,
    }: ST.CreateEntry) {
        const {requestId, tenantId, user, dlContext, isPrivateRoute} = ctx.get('info');

        const registry = ctx.get('registry');
        const {checkCreateEntryAvailability} = registry.common.functions.get();

        await checkCreateEntryAvailability({ctx, tenantId, scope, type});

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
                includePermissionsInfo,
            });
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
        unversionedData,
        links,
        permissionsMode,
        initialPermissions,
        initialParentId,
        ctx,
    }: ST.CreateEntry) {
        const {
            requestId,
            tenantId,
            dlContext,
            // TODO: Send isPrivateRoute. The issue is that the backend takes dl_config from the public and private APIs.
        } = ctx.get('info');

        const registry = ctx.get('registry');
        const {checkCreateEntryAvailability} = registry.common.functions.get();

        await checkCreateEntryAvailability({ctx, tenantId, scope, type});

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
                includePermissionsInfo: false,
            });
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
