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
import {WorkbookPermission} from '../../../../../entities/workbook';
import {SharedEntryInstance} from '../../../../../registry/common/entities/shared-entry/types';
import {getParentIds} from '../../../collection/utils';
import {ServiceArgs} from '../../../types';
import {getReplica} from '../../../utils';
import {checkWorkbookPermissionById} from '../../../workbook/utils/check-workbook-permission';

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
) {
    const {workbookId: requestWorkbookId, datasetId: requestDatasetId} = ctx.get('info');
    const checkEntryScope = sharedEntryInstance.model.scope;
    const checkEntryId = sharedEntryInstance.model.entryId;

    const isConnectionScope = checkEntryScope === EntryScope.Connection;
    const isDatasetScope = checkEntryScope === EntryScope.Dataset;

    if (!isConnectionScope && !isDatasetScope) {
        throwAccessError(ctx, `Entry scope is not supported: ${checkEntryScope}`);
    }

    if (isDatasetScope && !requestWorkbookId) {
        throwAccessError(
            ctx,
            `Inconsistent check entry scope ${checkEntryScope} without workbook id`,
        );
    }

    if (isDatasetScope && requestDatasetId) {
        throwAccessError(ctx, `Inconsistent check entry scope ${checkEntryScope} with dataset id`);
    }

    const withDatasetAndWorkbookContext =
        isConnectionScope && requestWorkbookId && requestDatasetId;
    const targetFilters: TargetFilter[] = [];
    const sourceIds: string[] = [checkEntryId];

    if (withDatasetAndWorkbookContext) {
        sourceIds.push(requestDatasetId);
    }

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
    }

    const entityBindings = await EntityBindingEntryPresentation.getSelectQuery(getReplica(trx), {
        targetFilters,
    })
        .whereIn(`${EntryModel.tableName}.${EntryColumn.EntryId}`, sourceIds)
        .timeout(getEntityBindingsQueryTimeout);

    if (entityBindings.length === 0) {
        throwAccessError(ctx, 'Not found entity bindings');
    }

    if (withDatasetAndWorkbookContext) {
        await checkConnectionWithWorkbookAndDataset(
            {ctx, trx},
            {
                entityBindings,
                workbookId: requestWorkbookId,
                datasetId: requestDatasetId,
                connectionId: checkEntryId,
                sharedEntryInstance,
                getParentsQueryTimeout,
                getWorkbookQueryTimeout,
            },
        );
        return;
    }

    if (entityBindings.length !== 1) {
        throwAccessError(ctx, 'Inconsistent entity bindings count');
    }

    const binding = entityBindings[0];
    if (binding.targetId === null) {
        const targetId = requestWorkbookId || requestDatasetId;
        throwAccessError(
            ctx,
            `Not found entity binding from source ${binding.sourceId} to target ${targetId}`,
        );
    }

    await Promise.all([
        getTargetPermissionPromise(
            {ctx, trx},
            {
                workbookId: requestWorkbookId,
                datasetId: requestDatasetId,
                getParentsQueryTimeout,
                getEntryQueryTimeout,
            },
        ),
        binding.isDelegated
            ? Promise.resolve()
            : checkCollectionEntry({ctx, trx}, {sharedEntryInstance, getParentsQueryTimeout}),
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
    }: CheckConnectionWithWorkbookAndDatasetArgs,
) {
    const datasetToWorkbookBinding = entityBindings.find(
        (binding) => binding.entryId === datasetId && binding.targetId === workbookId,
    );

    if (
        !datasetToWorkbookBinding ||
        (datasetToWorkbookBinding.workbookId !== workbookId &&
            datasetToWorkbookBinding.targetId !== workbookId)
    ) {
        throwAccessError(
            ctx,
            `Not found entity binding from source ${datasetId} to target ${workbookId}`,
        );
    }

    const connectionToDatasetBinding = entityBindings.find(
        (binding) => binding.entryId === connectionId && binding.targetId === datasetId,
    );

    if (!connectionToDatasetBinding) {
        throwAccessError(
            ctx,
            `Not found entity binding from source ${connectionId} to target ${datasetId}`,
        );
    }

    await Promise.all([
        checkWorkbookPermissionById({
            ctx,
            trx,
            workbookId,
            permission: WorkbookPermission.LimitedView,
            getWorkbookQueryTimeout,
            getParentsQueryTimeout,
        }),
        connectionToDatasetBinding.isDelegated
            ? Promise.resolve()
            : checkCollectionEntry({ctx, trx}, {sharedEntryInstance, getParentsQueryTimeout}),
    ]);
}

function getTargetPermissionPromise(
    {ctx, trx}: ServiceArgs,
    {
        workbookId,
        datasetId,
        getEntryQueryTimeout,
        getParentsQueryTimeout,
        getWorkbookQueryTimeout,
    }: {
        workbookId?: string;
        datasetId?: string;
        getEntryQueryTimeout?: number;
        getParentsQueryTimeout?: number;
        getWorkbookQueryTimeout?: number;
    },
): Promise<void> {
    if (workbookId) {
        return checkWorkbookPermissionById({
            ctx,
            trx,
            workbookId,
            permission: WorkbookPermission.LimitedView,
            getWorkbookQueryTimeout,
            getParentsQueryTimeout,
        });
    }

    if (datasetId) {
        return checkCollectionEntryById(
            {ctx, trx},
            {entryId: datasetId, getEntryQueryTimeout, getParentsQueryTimeout},
        );
    }

    return Promise.resolve();
}

async function checkCollectionEntry(
    {ctx, trx}: ServiceArgs,
    {
        sharedEntryInstance,
        getParentsQueryTimeout,
    }: {sharedEntryInstance: SharedEntryInstance; getParentsQueryTimeout?: number},
) {
    const parentIds = await getParentIds({
        ctx,
        trx,
        collectionId: sharedEntryInstance.model.collectionId as string,
        getParentsQueryTimeout,
    });

    await sharedEntryInstance.checkPermission({
        parentIds,
        permission: SharedEntryPermission.LimitedView,
    });
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

    await checkCollectionEntry(
        {ctx, trx},
        {sharedEntryInstance: entryInstance, getParentsQueryTimeout},
    );
}
