import {AppContext, AppError} from '@gravity-ui/nodekit';

import {US_ERRORS} from '../../../../../const/errors';
import {
    EntityBindingEntryPresentation,
    TargetFilter,
} from '../../../../../db/models/new/entity-binding/presentations/entity-binding-entry-presentation';
import {EntityBindingTargetType} from '../../../../../db/models/new/entity-binding/types';
import {EntryColumn, Entry as EntryModel} from '../../../../../db/models/new/entry';
import {EntryScope} from '../../../../../db/models/new/entry/types';
import {SharedEntryPermission} from '../../../../../entities/shared-entry';
import {SharedEntryInstance} from '../../../../../registry/common/entities/shared-entry/types';
import Utils from '../../../../../utils';
import {getParentIds} from '../../../collection/utils';
import {ServiceArgs} from '../../../types';
import {getReplica} from '../../../utils';
import {getWorkbook} from '../../../workbook/get-workbook';
import {getEntryPermissionsByWorkbook} from '../../../workbook/utils';
import type {EntryPermissions} from '../../types';

import {
    getMinimumReadOnlyCollectionEntryPermissions,
    getReadOnlyCollectionEntryPermissions,
    mapReadOnlyCollectionEntryPermissions,
} from './map-collection-entry-permissions';

function throwAccessError(ctx: AppContext, logMessage?: string): never {
    if (logMessage) {
        ctx.logError(logMessage);
    }
    throw new AppError(US_ERRORS.ACCESS_SERVICE_PERMISSION_DENIED, {
        code: US_ERRORS.ACCESS_SERVICE_PERMISSION_DENIED,
    });
}

type CheckEntityBindingsArgs = {
    sharedEntryInstance: SharedEntryInstance;
    getEntityBindingsQueryTimeout?: number;
    getParentsQueryTimeout?: number;
    getEntryQueryTimeout?: number;
    getWorkbookQueryTimeout?: number;
};

export async function checkEntityBindings(
    {ctx, trx}: ServiceArgs,
    {
        sharedEntryInstance,
        getEntityBindingsQueryTimeout = EntityBindingEntryPresentation.DEFAULT_QUERY_TIMEOUT,
        getEntryQueryTimeout,
        getParentsQueryTimeout,
        getWorkbookQueryTimeout,
    }: CheckEntityBindingsArgs,
): Promise<EntryPermissions> {
    const {workbookId: requestWorkbookId, datasetId: requestDatasetId} = ctx.get('info');
    const checkEntryScope = sharedEntryInstance.model.scope;
    const checkEntryId = sharedEntryInstance.model.entryId;

    ctx.log('CHECK_ENTITY_BINDINGS_START', {
        entryId: Utils.encodeId(sharedEntryInstance.model.entryId),
        requestWorkbookId: Utils.encodeId(requestWorkbookId),
        requestDatasetId: Utils.encodeId(requestDatasetId),
    });

    const targetFilters: TargetFilter[] = [];
    const sourceIds: string[] = [checkEntryId];

    switch (checkEntryScope) {
        case EntryScope.Connection: {
            if (!(requestWorkbookId || requestDatasetId)) {
                throwAccessError(
                    ctx,
                    `Inconsistent check entry scope ${checkEntryScope} without workbook id or dataset id`,
                );
            }
            if (requestWorkbookId && requestDatasetId) {
                sourceIds.push(requestDatasetId);
            }
            if (requestDatasetId) {
                targetFilters.push({
                    targetType: EntityBindingTargetType.Entries,
                    targetId: requestDatasetId,
                });
            }
            if (requestWorkbookId) {
                targetFilters.push({
                    targetType: EntityBindingTargetType.Workbooks,
                    targetId: requestWorkbookId,
                });
            }
            break;
        }
        case EntryScope.Dataset: {
            if (!requestWorkbookId) {
                throwAccessError(
                    ctx,
                    `Inconsistent check entry scope ${checkEntryScope} without workbook id`,
                );
            }
            if (requestDatasetId) {
                throwAccessError(
                    ctx,
                    `Inconsistent check entry scope ${checkEntryScope} with dataset id`,
                );
            }
            if (requestWorkbookId) {
                targetFilters.push({
                    targetType: EntityBindingTargetType.Workbooks,
                    targetId: requestWorkbookId,
                });
            }
            break;
        }
        default:
            throwAccessError(ctx, `Entry scope is not supported: ${checkEntryScope}`);
    }

    const entityBindings = await EntityBindingEntryPresentation.getSelectQuery(getReplica(trx), {
        targetFilters,
    })
        .whereIn(`${EntryModel.tableName}.${EntryColumn.EntryId}`, sourceIds)
        .timeout(getEntityBindingsQueryTimeout);

    if (entityBindings.length === 0) {
        throwAccessError(ctx, 'Not found entity bindings');
    }

    if (checkEntryScope === EntryScope.Connection && requestWorkbookId && requestDatasetId) {
        ctx.log('CHECK_CONNECTION_WITH_WORKBOOK_AND_DATASET_START');

        return await checkConnectionWithWorkbookAndDataset(
            {ctx, trx},
            {
                entityBindings,
                workbookId: requestWorkbookId,
                datasetId: requestDatasetId,
                connectionId: checkEntryId,
                sharedEntryInstance,
                getParentsQueryTimeout,
                getWorkbookQueryTimeout,
                getEntryQueryTimeout,
            },
        );
    }

    if (entityBindings.length !== 1) {
        throwAccessError(ctx, 'Inconsistent entity bindings count');
    }

    const binding = entityBindings[0];
    if (binding.targetId === null) {
        const targetId = requestWorkbookId || requestDatasetId;
        throwAccessError(
            ctx,
            `Not found entity binding from source ${Utils.encodeId(binding.sourceId)} to target ${Utils.encodeId(targetId)}`,
        );
    }

    const [collectionEntryPermissions, targetPermissions] = await Promise.all([
        binding.isDelegated
            ? Promise.resolve(getReadOnlyCollectionEntryPermissions())
            : checkCollectionEntry({ctx, trx}, {sharedEntryInstance, getParentsQueryTimeout}),
        getTargetPermissionPromise(
            {ctx, trx},
            {
                workbookId: requestWorkbookId,
                datasetId: requestDatasetId,
                sharedEntryInstance,
                getParentsQueryTimeout,
                getEntryQueryTimeout,
            },
        ),
    ]);
    return getMinimumReadOnlyCollectionEntryPermissions([
        collectionEntryPermissions,
        targetPermissions,
    ]);
}

type CheckConnectionWithWorkbookAndDatasetArgs = {
    entityBindings: EntityBindingEntryPresentation[];
    workbookId: string;
    datasetId: string;
    connectionId: string;
    sharedEntryInstance: SharedEntryInstance;
    getParentsQueryTimeout?: number;
    getWorkbookQueryTimeout?: number;
    getEntryQueryTimeout?: number;
};

async function checkConnectionWithWorkbookAndDataset(
    {ctx, trx}: ServiceArgs,
    {
        entityBindings,
        workbookId,
        datasetId,
        connectionId,
        sharedEntryInstance,
        getParentsQueryTimeout,
        getWorkbookQueryTimeout,
        getEntryQueryTimeout,
    }: CheckConnectionWithWorkbookAndDatasetArgs,
) {
    const datasetToWorkbookBinding = entityBindings.find(
        (binding) => binding.entryId === datasetId,
    );

    if (!datasetToWorkbookBinding) {
        throwAccessError(
            ctx,
            `Not found entity binding from source ${Utils.encodeId(datasetId)} to target ${Utils.encodeId(workbookId)}`,
        );
    }

    // The dataset should have binding to workbook or should be contained in the workbook
    if (
        datasetToWorkbookBinding.workbookId !== workbookId &&
        datasetToWorkbookBinding.targetId !== workbookId
    ) {
        throwAccessError(
            ctx,
            `Dataset ${Utils.encodeId(datasetId)} is not properly bound to workbook ${Utils.encodeId(workbookId)}`,
        );
    }

    const isDatasetInsideWorkbook = datasetToWorkbookBinding.workbookId === workbookId;

    const connectionToDatasetBinding = entityBindings.find(
        (binding) => binding.entryId === connectionId && binding.targetId === datasetId,
    );
    const connectionToWorkbookBinding = entityBindings.find(
        (binding) => binding.entryId === connectionId && binding.targetId === workbookId,
    );
    const connectionToTargetBinding = isDatasetInsideWorkbook
        ? connectionToWorkbookBinding
        : connectionToDatasetBinding;

    if (!connectionToTargetBinding) {
        throwAccessError(
            ctx,
            `Not found entity binding from source ${Utils.encodeId(connectionId)} to target ${isDatasetInsideWorkbook ? Utils.encodeId(workbookId) : Utils.encodeId(datasetId)}`,
        );
    }

    const [collectionEntryPermissions, datasetEntryPermissions, workbookEntryPermissions] =
        await Promise.all([
            connectionToTargetBinding.isDelegated
                ? Promise.resolve(getReadOnlyCollectionEntryPermissions())
                : checkCollectionEntry({ctx, trx}, {sharedEntryInstance, getParentsQueryTimeout}),
            datasetToWorkbookBinding.isDelegated || isDatasetInsideWorkbook
                ? Promise.resolve(getReadOnlyCollectionEntryPermissions())
                : checkCollectionEntryById(
                      {ctx, trx},
                      {entryId: datasetId, getEntryQueryTimeout, getParentsQueryTimeout},
                  ),
            checkEntryByWorkbook(
                {ctx, trx},
                {
                    workbookId,
                    scope: sharedEntryInstance.model.scope,
                    getParentsQueryTimeout,
                    getWorkbookQueryTimeout,
                },
            ),
        ]);
    return getMinimumReadOnlyCollectionEntryPermissions([
        collectionEntryPermissions,
        datasetEntryPermissions,
        workbookEntryPermissions,
    ]);
}

function getTargetPermissionPromise(
    {ctx, trx}: ServiceArgs,
    {
        sharedEntryInstance,
        workbookId,
        datasetId,
        getEntryQueryTimeout,
        getParentsQueryTimeout,
        getWorkbookQueryTimeout,
    }: {
        sharedEntryInstance: SharedEntryInstance;
        workbookId?: string;
        datasetId?: string;
        getEntryQueryTimeout?: number;
        getParentsQueryTimeout?: number;
        getWorkbookQueryTimeout?: number;
    },
): Promise<EntryPermissions> {
    ctx.log('GET_TARGET_PERMISSION_START', {
        workbookId: Utils.encodeId(workbookId),
        datasetId: Utils.encodeId(datasetId),
    });

    if (workbookId) {
        return checkEntryByWorkbook(
            {ctx, trx},
            {
                workbookId,
                scope: sharedEntryInstance.model.scope,
                getParentsQueryTimeout,
                getWorkbookQueryTimeout,
            },
        );
    }

    if (datasetId) {
        return checkCollectionEntryById(
            {ctx, trx},
            {entryId: datasetId, getEntryQueryTimeout, getParentsQueryTimeout},
        );
    }

    return Promise.reject('No workbook or dataset id');
}

async function checkCollectionEntry(
    {ctx, trx}: ServiceArgs,
    {
        sharedEntryInstance,
        getParentsQueryTimeout,
    }: {sharedEntryInstance: SharedEntryInstance; getParentsQueryTimeout?: number},
) {
    ctx.log('CHECK_COLLECTION_ENTRY_START', {
        entryId: Utils.encodeId(sharedEntryInstance.model.entryId),
    });

    const parentIds = await getParentIds({
        ctx,
        trx,
        collectionId: sharedEntryInstance.model.collectionId as string,
        getParentsQueryTimeout,
    });

    await sharedEntryInstance.fetchAllPermissions({
        parentIds,
    });

    if (!sharedEntryInstance.permissions?.[SharedEntryPermission.LimitedView]) {
        throw new AppError(US_ERRORS.ACCESS_SERVICE_PERMISSION_DENIED, {
            code: US_ERRORS.ACCESS_SERVICE_PERMISSION_DENIED,
        });
    }

    return mapReadOnlyCollectionEntryPermissions({sharedEntry: sharedEntryInstance, ctx});
}

async function checkCollectionEntryById(
    {ctx, trx}: ServiceArgs,
    {
        entryId,
        getEntryQueryTimeout = EntryModel.DEFAULT_QUERY_TIMEOUT,
        getParentsQueryTimeout,
    }: {entryId: string; getEntryQueryTimeout?: number; getParentsQueryTimeout?: number},
) {
    const {tenantId} = ctx.get('info');
    const registry = ctx.get('registry');
    const {SharedEntry} = registry.common.classes.get();

    ctx.log('CHECK_COLLECTION_ENTRY_BY_ID_START', {
        entryId: Utils.encodeId(entryId),
    });

    const entryModel = await EntryModel.query(getReplica(trx))
        .select()
        .where({
            [EntryColumn.TenantId]: tenantId,
            [EntryColumn.IsDeleted]: false,
        })
        .where(EntryColumn.EntryId, entryId)
        .whereNotNull(EntryColumn.CollectionId)
        .first()
        .timeout(getEntryQueryTimeout);

    if (!entryModel) {
        throw new AppError(US_ERRORS.NOT_EXIST_ENTRY, {
            code: US_ERRORS.NOT_EXIST_ENTRY,
        });
    }

    const entryInstance = new SharedEntry({
        ctx,
        model: entryModel,
    });

    return await checkCollectionEntry(
        {ctx, trx},
        {sharedEntryInstance: entryInstance, getParentsQueryTimeout},
    );
}

async function checkEntryByWorkbook(
    {ctx, trx}: ServiceArgs,
    {
        workbookId,
        scope,
        getParentsQueryTimeout,
        getWorkbookQueryTimeout,
    }: {
        workbookId: string;
        scope: EntryScope;
        getParentsQueryTimeout?: number;
        getWorkbookQueryTimeout?: number;
    },
) {
    const workbook = await getWorkbook(
        {ctx, trx},
        {workbookId, getParentsQueryTimeout, getWorkbookQueryTimeout, includePermissionsInfo: true},
    );
    const permissions = getEntryPermissionsByWorkbook({workbook, scope}) as EntryPermissions;
    return permissions;
}
