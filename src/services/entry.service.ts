import Entry from '../db/models/entry';
import * as ST from '../types/services.types';
import {createEntryInWorkbook, validateCreateEntryInWorkbook} from './entry';
import {SYSTEM_USER} from '../const';

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
        data,
        unversionedData,
        links,
        permissionsMode,
        includePermissionsInfo,
        initialPermissions,
        initialParentId,
        ctx,
    }: ST.CreateEntry) {
        if (workbookId) {
            const validatedData = validateCreateEntryInWorkbook({
                workbookId,
                name: name as string,
                scope,
                type,
                links,
                hidden,
                unversionedData,
                meta,
                data,
                includePermissionsInfo,
            });

            return await createEntryInWorkbook(ctx, validatedData);
        }

        const {requestId, tenantId, user, dlContext, isPrivateRoute} = ctx.get('info');

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
        data,
        unversionedData,
        links,
        permissionsMode,
        initialPermissions,
        initialParentId,
        ctx,
    }: ST.CreateEntry) {
        if (workbookId) {
            const validatedData = validateCreateEntryInWorkbook({
                workbookId,
                name: name as string,
                scope,
                type,
                links,
                hidden,
                unversionedData,
                meta,
                data,
                includePermissionsInfo: false,
            });

            return await createEntryInWorkbook(ctx, validatedData);
        }

        const {
            requestId,
            tenantId,
            dlContext,
            // TODO: Send isPrivateRoute. The issue is that the backend takes dl_config from the public and private APIs.
        } = ctx.get('info');
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
