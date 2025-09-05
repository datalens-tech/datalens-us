import {AppContext, AppError} from '@gravity-ui/nodekit';

import {US_ERRORS} from '../../../../const/errors';
import {
    EntityBindingEntryPresentation,
    TargetFilter,
} from '../../../../db/models/new/entity-binding/presentations/entity-binding-entry-presentation';
import {EntityBindingTargetType} from '../../../../db/models/new/entity-binding/types';
import {EntryColumn, Entry as EntryModel} from '../../../../db/models/new/entry';
import {EntryScope} from '../../../../db/models/new/entry/types';
import {SharedEntryPermission} from '../../../../entities/shared-entry';
import {WorkbookPermission} from '../../../../entities/workbook';
import {SharedEntryInstance} from '../../../../registry/common/entities/shared-entry/types';
import {getParentIds} from '../../collection/utils';
import {ServiceArgs} from '../../types';
import {getReplica} from '../../utils';
import {checkWorkbookPermissionById} from '../../workbook/utils/check-workbook-permission';

export interface CheckAndGetCollectionEntryPermissionArgs {
    sharedEntryInstance: SharedEntryInstance;
    includePermissionsInfo?: boolean; // is real need?
    skipCheckPermissions?: boolean;
}

// TODO: set timeouts
export async function checkAndGetCollectionEntryPermission(
    {ctx, trx}: ServiceArgs,
    args: CheckAndGetCollectionEntryPermissionArgs,
) {
    const {skipCheckPermissions = false, sharedEntryInstance} = args;

    ctx.log('CHECK_COLLECTION_ENTRY_PERMISSION_START');

    const {
        isPrivateRoute,
        workbookId: requestWorkbookId,
        datasetId: requestDatasetId,
    } = ctx.get('info');
    const {accessServiceEnabled} = ctx.config;

    if (accessServiceEnabled && !skipCheckPermissions && !isPrivateRoute) {
        if (requestWorkbookId || requestDatasetId) {
            await checkEntityBindings({ctx, trx}, sharedEntryInstance);
            // if passed then read only mode
        } else {
            const parentIds = await getParentIds({
                ctx,
                trx,
                collectionId: sharedEntryInstance.model.collectionId as string,
            });
            await sharedEntryInstance.checkPermission({
                parentIds,
                permission: SharedEntryPermission.LimitedView,
            });

            await sharedEntryInstance.fetchAllPermissions({parentIds});
        }
    } else {
        sharedEntryInstance.enableAllPermissions();
    }

    ctx.log('CHECK_COLLECTION_ENTRY_PERMISSION_FINISH');

    return sharedEntryInstance;
}

async function checkEntityBindings(
    {ctx, trx}: ServiceArgs,
    sharedEntryInstance: SharedEntryInstance,
) {
    const {workbookId: requestWorkbookId, datasetId: requestDatasetId} = ctx.get('info');

    const targetFilters: TargetFilter[] = [];
    const sourceIds: string[] = [sharedEntryInstance.model.entryId];
    const checkEntryScope = sharedEntryInstance.model.scope;
    const isConnectionScope = checkEntryScope === EntryScope.Connection;

    if (requestWorkbookId) {
        targetFilters.push({
            targetType: EntityBindingTargetType.Workbooks,
            targetId: requestWorkbookId,
        });
    }

    if (requestDatasetId && isConnectionScope) {
        targetFilters.push({
            targetType: EntityBindingTargetType.Entries,
            targetId: requestDatasetId,
        });
        sourceIds.push(requestDatasetId);
    }

    const entityBindings = await EntityBindingEntryPresentation.getSelectQuery(getReplica(trx), {
        targetFilters,
    })
        .whereIn(`${EntryModel.tableName}.${EntryColumn.EntryId}`, sourceIds)
        .timeout(EntityBindingEntryPresentation.DEFAULT_QUERY_TIMEOUT);

    if (entityBindings.length === 0) {
        throwAccessError(ctx, 'Not found entity bindings');
    }

    if (isConnectionScope) {
        // Если связи DS-WB нет - 403
        // Исключение DS🏠WB, но нужно проверить,
        // что у DS workbook_id совпадает, иначе - 403
        if (requestWorkbookId && requestDatasetId) {
            // ...
            return;
        } else {
            const binding = entityBindings[0];
            if (binding.targetId === null) {
                throwAccessError(
                    ctx,
                    `Not found entity binding from source ${binding.sourceId} to target ${binding.targetId}`,
                );
            }
            let checkTargetPermissionPromise = Promise.resolve();
            if (requestWorkbookId) {
                checkTargetPermissionPromise = checkWorkbookPermissionById({
                    ctx,
                    trx,
                    workbookId: requestWorkbookId,
                    permission: WorkbookPermission.LimitedView,
                });
            }
            if (requestDatasetId) {
                checkTargetPermissionPromise = checkCollectionEntryById(
                    {ctx, trx},
                    requestDatasetId,
                );
            }
            const checkCollectionEntryPromise = binding.isDelegated
                ? Promise.resolve()
                : checkCollectionEntry({ctx, trx}, sharedEntryInstance);

            await Promise.all([checkTargetPermissionPromise, checkCollectionEntryPromise]);
        }
    } else if (checkEntryScope === EntryScope.Dataset) {
        if (!requestWorkbookId) {
            throwAccessError(
                ctx,
                `Inconsistant check entry scope ${checkEntryScope} without workbook id`,
            );
        }
        const binding = entityBindings[0];
        if (binding.targetId === null) {
            throwAccessError(
                ctx,
                `Not found entity binding from source ${binding.sourceId} to target ${binding.targetId}`,
            );
        }
        const checkWorkbookPermissionPromise = checkWorkbookPermissionById({
            ctx,
            trx,
            workbookId: requestWorkbookId,
            permission: WorkbookPermission.LimitedView,
        });
        const checkCollectionEntryPromise = binding.isDelegated
            ? Promise.resolve()
            : checkCollectionEntry({ctx, trx}, sharedEntryInstance);

        await Promise.all([checkWorkbookPermissionPromise, checkCollectionEntryPromise]);
    } else {
        throwAccessError(ctx, `Entry scope is not supported: ${checkEntryScope}`);
    }
}

function throwAccessError(ctx: AppContext, logMessage?: string): never {
    if (logMessage) {
        ctx.logError(logMessage);
    }
    throw new AppError(US_ERRORS.ACCESS_SERVICE_PERMISSION_DENIED, {
        code: US_ERRORS.ACCESS_SERVICE_PERMISSION_DENIED,
    });
}

async function checkCollectionEntry(
    {ctx, trx}: ServiceArgs,
    sharedEntryInstance: SharedEntryInstance,
) {
    const parentIds = await getParentIds({
        ctx,
        trx,
        collectionId: sharedEntryInstance.model.collectionId as string,
    });

    await sharedEntryInstance.checkPermission({
        parentIds,
        permission: SharedEntryPermission.LimitedView,
    });
}

async function checkCollectionEntryById({ctx, trx}: ServiceArgs, entryId: string) {
    const {tenantId} = ctx.get('info');
    const registry = ctx.get('registry');
    const {SharedEntry} = registry.common.classes.get();

    const entryModel = await EntryModel.query(getReplica(trx))
        .select()
        .where({
            [EntryColumn.TenantId]: tenantId,
            [EntryColumn.IsDeleted]: false,
        })
        .where(EntryColumn.EntryId, entryId)
        .whereNotNull(EntryColumn.CollectionId)
        .first()
        .timeout(EntryModel.DEFAULT_QUERY_TIMEOUT);

    if (!entryModel) {
        throw new AppError(US_ERRORS.NOT_EXIST_ENTRY, {
            code: US_ERRORS.NOT_EXIST_ENTRY,
        });
    }

    const entryInstance = new SharedEntry({
        ctx,
        model: entryModel,
    });

    await checkCollectionEntry({ctx, trx}, entryInstance);
}
