import {TransactionOrKnex} from 'objection';
import {AppContext} from '@gravity-ui/nodekit';
import {Permissions} from '../../../../entities/workbook';
import {getParentIds} from '../../collection/utils';
import {getReplica} from '../../utils';
import type {WorkbookInstance} from '../../../../registry/common/entities/workbook/types';
import {Feature, isEnabledFeature} from '../../../../components/features';

export const getEntryPermissionsByWorkbook = async ({
    ctx,
    trx,
    workbook,
    bypassEnabled,
}: {
    ctx: AppContext;
    trx?: TransactionOrKnex;
    workbook: WorkbookInstance;
    bypassEnabled?: boolean;
}) => {
    const {accessServiceEnabled} = ctx.config;

    if (!accessServiceEnabled || bypassEnabled) {
        return {
            execute: true,
            read: true,
            edit: true,
            admin: true,
        };
    }

    if (workbook.permissions === undefined) {
        let parentIds: string[] = [];

        if (workbook.model.collectionId !== null) {
            parentIds = await getParentIds({
                ctx,
                trx: getReplica(trx),
                collectionId: workbook.model.collectionId,
            });
        }

        await workbook.fetchAllPermissions({parentIds});
    }

    const permissions = workbook.permissions as Permissions;

    return {
        execute: isEnabledFeature(ctx, Feature.UseLimitedView)
            ? permissions.limitedView
            : permissions.view,
        read: permissions.view,
        edit: permissions.update,
        admin: permissions.updateAccessBindings,
    };
};
