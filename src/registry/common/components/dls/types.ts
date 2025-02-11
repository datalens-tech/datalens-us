import type {AppContext} from '@gravity-ui/nodekit';
import {TransactionOrKnex} from 'objection';

import * as MT from '../../../../types/models';

export interface DLSConstructor {
    new (): {};

    checkPermission: (
        {ctx, trx}: {ctx: AppContext; trx?: TransactionOrKnex},
        checkPermissionsArgs: MT.CheckPermissionDlsConfig,
    ) => Promise<any>;

    checkBulkPermission<E extends object>(
        {ctx, trx}: {ctx: AppContext; trx?: TransactionOrKnex},
        checkBulkPermissionArgs: MT.CheckBulkPermissionsDlsConfig<E>,
    ): Promise<Array<E & MT.DlsEntity>>;

    addEntity(
        {ctx, trx}: {ctx: AppContext; trx?: TransactionOrKnex},
        addEntityArgs: MT.CreationDlsEntityConfig,
    ): Promise<any>;

    modifyPermissions(
        {ctx, trx}: {ctx: AppContext; trx?: TransactionOrKnex},
        modifyPermissionsArgs: MT.ModifyPermissionDlsConfig,
    ): Promise<any>;
}
