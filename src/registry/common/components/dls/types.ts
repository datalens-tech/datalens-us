import type {AppContext} from '@gravity-ui/nodekit';
import {TransactionOrKnex} from 'objection';
import * as MT from '../../../../types/models';

export interface DLSConstructor {
    new (): {};

    fillPredefinedPermissions: (
        userIdDLS: string,
        initialPermissions: [],
        ctx: AppContext,
    ) => [] | {[key: string]: object[]};

    checkIamManagePermission: (ctx: AppContext) => Promise<boolean>;

    checkEntriesInTenant: (
        {ctx, trx}: {ctx: AppContext; trx?: TransactionOrKnex},
        entryIds: string[],
    ) => Promise<void>;

    prepareHeaders: (
        ctx: AppContext,
        requestId: string,
        hasIamManagePermission: boolean,
    ) => Record<string, string>;

    checkPermission: (
        {ctx, trx}: {ctx: AppContext; trx?: TransactionOrKnex},
        checkPermissionsArgs: MT.CheckPermissionDlsConfig,
    ) => Promise<any>;

    checkBulkPermission(
        {ctx, trx}: {ctx: AppContext; trx?: TransactionOrKnex},
        checkBulkPermissionArgs: MT.CheckBulkPermissionsDlsConfig,
        skipEntriesInTenantCheck?: boolean,
    ): Promise<any[]>;

    addEntity(
        {ctx, trx}: {ctx: AppContext; trx?: TransactionOrKnex},
        addEntityArgs: MT.CreationDlsEntityConfig,
    ): Promise<any>;

    getPermissions(
        {ctx, trx}: {ctx: AppContext; trx?: TransactionOrKnex},
        getPermissionsArgs: MT.GetPermissionDlsConfig,
    ): Promise<any>;

    modifyPermissions(
        {ctx, trx}: {ctx: AppContext; trx?: TransactionOrKnex},
        modifyPermissionsArgs: MT.ModifyPermissionDlsConfig,
        preparedHasIamManagePermission?: boolean,
    ): Promise<any>;

    batchPermissions(
        {ctx, trx}: {ctx: AppContext; trx?: TransactionOrKnex},
        batchPermissionsArgs: MT.BatchPermissionDlsConfig,
    ): Promise<any>;

    suggest(cx: AppContext, suggestArgs: MT.GetSuggestDlsConfig): Promise<any>;
}
