import {AppContext} from '@gravity-ui/nodekit';
import {TransactionOrKnex} from 'objection';

import {AccessServicePermissionDeniedError} from '../../../../components/errors';
import {Entry as EntryModel} from '../../../../db/models/new/entry';
import {WorkbookModel} from '../../../../db/models/new/workbook';
import {WorkbookPermission} from '../../../../entities/workbook';
import {getParentIds} from '../../collection/utils';
import {getReplica} from '../../utils';
import {getEntryPermissionsByWorkbook} from '../../workbook/utils';
import {CollectionEntryPermissions, resolveCollectionEntryPermissions} from '../collection-entry';

import {
    ENTITY_BINDING_QUERY_TIMEOUT,
    ENTRY_QUERY_TIMEOUT,
    GET_PARENTS_QUERY_TIMEOUT,
    WORKBOOK_QUERY_TIMEOUT,
} from './constants';
import {SelectedEntry} from './types';

export const checkWorkbookEntry = async ({
    ctx,
    trx,
    entry,
    workbook,
    includePermissionsInfo,
}: {
    ctx: AppContext;
    trx?: TransactionOrKnex;
    entry: SelectedEntry;
    workbook: WorkbookModel;
    includePermissionsInfo?: boolean;
}) => {
    let parentIds: string[] = [];

    if (workbook.collectionId !== null) {
        parentIds = await getParentIds({
            ctx,
            trx: getReplica(trx),
            collectionId: workbook.collectionId,
            getParentsQueryTimeout: GET_PARENTS_QUERY_TIMEOUT,
        });
    }

    const registry = ctx.get('registry');

    const {Workbook} = registry.common.classes.get();

    const workbookInstance = new Workbook({
        ctx,
        model: workbook,
    });

    const {accessServiceEnabled} = ctx.config;

    if (accessServiceEnabled) {
        if (includePermissionsInfo) {
            await workbookInstance.fetchAllPermissions({parentIds});

            if (!workbookInstance.permissions?.[WorkbookPermission.LimitedView]) {
                throw new AccessServicePermissionDeniedError();
            }
        } else {
            await workbookInstance.checkPermission({
                parentIds,
                permission: WorkbookPermission.LimitedView,
            });
        }
    } else {
        workbookInstance.enableAllPermissions();
    }

    if (includePermissionsInfo) {
        return getEntryPermissionsByWorkbook({
            workbook: workbookInstance,
            scope: entry.scope,
        });
    }

    return undefined;
};

export const checkCollectionEntry = async ({
    ctx,
    trx,
    entry,
    permission,
    includePermissionsInfo,
    skipCheckPermissions,
}: {
    ctx: AppContext;
    trx?: TransactionOrKnex;
    entry: SelectedEntry;
    permission: CollectionEntryPermissions;
    includePermissionsInfo?: boolean;
    skipCheckPermissions?: boolean;
}) => {
    return await resolveCollectionEntryPermissions(
        {ctx, trx},
        {
            entry: entry as unknown as EntryModel,
            permission,
            includePermissions: includePermissionsInfo,
            skipCheckPermissions,
            getEntityBindingsQueryTimeout: ENTITY_BINDING_QUERY_TIMEOUT,
            getParentsQueryTimeout: GET_PARENTS_QUERY_TIMEOUT,
            getEntryQueryTimeout: ENTRY_QUERY_TIMEOUT,
            getWorkbookQueryTimeout: WORKBOOK_QUERY_TIMEOUT,
        },
    );
};
