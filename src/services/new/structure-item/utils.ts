import {AppContext, AppError} from '@gravity-ui/nodekit';
import {raw} from 'objection';

import {US_ERRORS} from '../../../const';
import {CollectionModel, CollectionModelColumn} from '../../../db/models/new/collection';
import {EntryColumn, Entry as EntryModel} from '../../../db/models/new/entry';
import {WorkbookModel, WorkbookModelColumn} from '../../../db/models/new/workbook';
import {CollectionPermission} from '../../../entities/collection';
import {SharedEntryPermission} from '../../../entities/shared-entry';
import {WorkbookPermission} from '../../../entities/workbook';
import {CollectionInstance} from '../../../registry/common/entities/collection/types';
import {SharedEntryInstance} from '../../../registry/common/entities/shared-entry/types';
import {WorkbookInstance} from '../../../registry/common/entities/workbook/types';
import Utils, {makeUserId} from '../../../utils';
import {ServiceArgs} from '../types';
import {getReplica} from '../utils';

const ENTITY_RANK = {
    COLLECTION: 1,
    WORKBOOK: 2,
    ENTRY: 3,
};

interface GetWorkbooksQueryArgs {
    collectionId: Nullable<string>;
    filterString?: string;
    onlyMy?: boolean;
}
export const getWorkbooksQuery = ({ctx, trx}: ServiceArgs, args: GetWorkbooksQueryArgs) => {
    const {filterString, onlyMy, collectionId} = args;
    const {
        tenantId,
        user: {userId},
    } = ctx.get('info');

    const targetTrx = getReplica(trx);
    return WorkbookModel.query(targetTrx)
        .select([
            raw('? as rank', ENTITY_RANK.WORKBOOK),
            WorkbookModelColumn.WorkbookId,
            WorkbookModelColumn.CollectionId,
            WorkbookModelColumn.Title,
            WorkbookModelColumn.SortTitle,
            WorkbookModelColumn.Description,
            raw('null as ??', CollectionModelColumn.ParentId),
            WorkbookModelColumn.TenantId,
            WorkbookModelColumn.CreatedBy,
            WorkbookModelColumn.CreatedAt,
            WorkbookModelColumn.UpdatedBy,
            WorkbookModelColumn.UpdatedAt,
            WorkbookModelColumn.Meta,
            WorkbookModelColumn.Status,
            raw('null::bigint as ??', EntryColumn.EntryId),
            raw('null::scope as ??', EntryColumn.Scope),
            raw('null as ??', EntryColumn.Type),
            raw('null as ??', EntryColumn.DisplayKey),
            raw('null as ??', EntryColumn.Key),
        ])
        .where({
            [WorkbookModelColumn.TenantId]: tenantId,
            [WorkbookModelColumn.CollectionId]: collectionId,
            [WorkbookModelColumn.DeletedAt]: null,
        })
        .where((qb) => {
            if (filterString) {
                const preparedFilterString = Utils.escapeStringForLike(filterString.toLowerCase());
                qb.where(WorkbookModelColumn.TitleLower, 'LIKE', `%${preparedFilterString}%`);
            }
            if (onlyMy) {
                qb.where({
                    [WorkbookModelColumn.CreatedBy]: userId,
                });
            }
        });
};

interface GetCollectionsQueryArgs {
    collectionId: Nullable<string>;
    filterString?: string;
    onlyMy?: boolean;
}
export const getCollectionsQuery = ({ctx, trx}: ServiceArgs, args: GetCollectionsQueryArgs) => {
    const {filterString, onlyMy, collectionId} = args;
    const {
        tenantId,
        user: {userId},
    } = ctx.get('info');

    const targetTrx = getReplica(trx);

    return CollectionModel.query(targetTrx)
        .select([
            raw('? as rank', ENTITY_RANK.COLLECTION),
            raw('null as ??', WorkbookModelColumn.WorkbookId),
            CollectionModelColumn.CollectionId,
            CollectionModelColumn.Title,
            CollectionModelColumn.SortTitle,
            CollectionModelColumn.Description,
            CollectionModelColumn.ParentId,
            CollectionModelColumn.TenantId,
            CollectionModelColumn.CreatedBy,
            CollectionModelColumn.CreatedAt,
            CollectionModelColumn.UpdatedBy,
            CollectionModelColumn.UpdatedAt,
            CollectionModelColumn.Meta,
            raw('null as ??', WorkbookModelColumn.Status),
            raw('null::bigint as ??', EntryColumn.EntryId),
            raw('null::scope as ??', EntryColumn.Scope),
            raw('null as ??', EntryColumn.Type),
            raw('null as ??', EntryColumn.DisplayKey),
            raw('null as ??', EntryColumn.Key),
        ])
        .where({
            [CollectionModelColumn.TenantId]: tenantId,
            [CollectionModelColumn.DeletedAt]: null,
            [CollectionModelColumn.ParentId]: collectionId,
        })
        .where((qb) => {
            if (filterString) {
                const preparedFilterString = Utils.escapeStringForLike(filterString.toLowerCase());
                qb.where(CollectionModelColumn.TitleLower, 'LIKE', `%${preparedFilterString}%`);
            }
            if (onlyMy) {
                qb.where({
                    [CollectionModelColumn.CreatedBy]: userId,
                });
            }
        });
};

interface GetEntryQueryArgs {
    collectionId: string;
    filterString?: string;
    onlyMy?: boolean;
}
export const getEntryQuery = ({ctx, trx}: ServiceArgs, args: GetEntryQueryArgs) => {
    const {filterString, onlyMy, collectionId} = args;
    const {
        tenantId,
        user: {userId},
    } = ctx.get('info');

    const targetTrx = getReplica(trx);
    return EntryModel.query(targetTrx)
        .select([
            raw('? as rank', ENTITY_RANK.ENTRY),
            EntryColumn.WorkbookId,
            EntryColumn.CollectionId,
            raw('null as ??', CollectionModelColumn.Title),
            raw('?? as ??', [EntryColumn.SortName, CollectionModelColumn.SortTitle]),
            raw('null as ??', CollectionModelColumn.Description),
            raw('null as ??', CollectionModelColumn.ParentId),
            EntryColumn.TenantId,
            EntryColumn.CreatedBy,
            EntryColumn.CreatedAt,
            EntryColumn.UpdatedBy,
            EntryColumn.UpdatedAt,
            raw('null as ??', CollectionModelColumn.Meta),
            raw('null as ??', WorkbookModelColumn.Status),
            EntryColumn.EntryId,
            EntryColumn.Scope,
            EntryColumn.Type,
            EntryColumn.DisplayKey,
            EntryColumn.Key,
        ])
        .where({
            [EntryColumn.TenantId]: tenantId,
            [EntryColumn.CollectionId]: collectionId,
            [EntryColumn.IsDeleted]: false,
        })
        .where((qb) => {
            if (filterString) {
                const preparedFilterString = Utils.escapeStringForLike(filterString.toLowerCase());
                qb.whereLike(EntryColumn.Name, `%${preparedFilterString}%`);
            }
            if (onlyMy) {
                qb.where({
                    [EntryColumn.CreatedBy]: makeUserId(userId),
                });
            }
        });
};

interface ProcessPermissionsArgs {
    ctx: AppContext;
    models: (CollectionModel | WorkbookModel | EntryModel)[];
    parentIds: string[];
    skipCheckPermissions: boolean;
    includePermissionsInfo: boolean;
}
export const processPermissions = async ({
    ctx,
    models,
    parentIds,
    skipCheckPermissions,
    includePermissionsInfo,
}: ProcessPermissionsArgs) => {
    let result;

    const {accessServiceEnabled} = ctx.config;
    const registry = ctx.get('registry');
    const {Workbook, Collection, SharedEntry} = registry.common.classes.get();

    if (accessServiceEnabled && !skipCheckPermissions) {
        const checkedItems = await Promise.all(
            models.map(async (model: WorkbookModel | CollectionModel | EntryModel) => {
                let item: WorkbookInstance | CollectionInstance | SharedEntryInstance;

                try {
                    if (isSharedEntryModel(model)) {
                        item = new SharedEntry({ctx, model});
                        await item.checkPermission({
                            parentIds,
                            permission: SharedEntryPermission.LimitedView,
                        });
                    } else if (isWorkbookModel(model)) {
                        item = new Workbook({ctx, model});
                        await item.checkPermission({
                            parentIds,
                            permission: WorkbookPermission.LimitedView,
                        });
                    } else {
                        item = new Collection({ctx, model});
                        await item.checkPermission({
                            parentIds,
                            permission: CollectionPermission.LimitedView,
                        });
                    }

                    return item;
                } catch (error) {
                    const err = error as AppError;

                    if (err.code === US_ERRORS.ACCESS_SERVICE_PERMISSION_DENIED) {
                        return null;
                    }

                    throw error;
                }
            }),
        );

        result = checkedItems.filter((item) => item !== null) as InstanceType<
            typeof Collection | typeof Workbook | typeof SharedEntry
        >[];

        if (includePermissionsInfo) {
            result = await bulkFetchStructureItemsAllPermissions(
                ctx,
                result.map((item) => ({
                    model: item.model,
                    parentIds,
                })),
            );
        }
    } else {
        result = models.map((model: WorkbookModel | CollectionModel | EntryModel) => {
            let item: WorkbookInstance | CollectionInstance | SharedEntryInstance;
            if (isSharedEntryModel(model)) {
                item = new SharedEntry({ctx, model});
            } else if (isWorkbookModel(model)) {
                item = new Workbook({ctx, model});
            } else {
                item = new Collection({ctx, model});
            }

            if (includePermissionsInfo) {
                item.enableAllPermissions();
            }

            return item;
        });
    }
    return result;
};

function isSharedEntryModel(
    model: CollectionModel | WorkbookModel | EntryModel,
): model is EntryModel {
    return 'entryId' in model && Boolean(model.entryId);
}
function isWorkbookModel(
    model: CollectionModel | WorkbookModel | EntryModel,
): model is WorkbookModel {
    return !isSharedEntryModel(model) && 'workbookId' in model && Boolean(model.workbookId);
}

async function bulkFetchStructureItemsAllPermissions(
    ctx: AppContext,
    items: {model: CollectionModel | WorkbookModel | EntryModel; parentIds: string[]}[],
) {
    if (items.length === 0) {
        return [];
    }

    const registry = ctx.get('registry');
    const {Workbook, Collection, SharedEntry} = registry.common.classes.get();

    const collectionItems: {model: CollectionModel; parentIds: string[]}[] = [];
    const workbookItems: {model: WorkbookModel; parentIds: string[]}[] = [];
    const sharedEntryItems: {model: EntryModel; parentIds: string[]}[] = [];
    items.forEach(({model, parentIds}) => {
        if (isSharedEntryModel(model)) {
            sharedEntryItems.push({model, parentIds});
        } else if (isWorkbookModel(model)) {
            workbookItems.push({model, parentIds});
        } else {
            collectionItems.push({model, parentIds});
        }
    });

    const [collectionsWithPermissions, workbooksWithPermissions, sharedEntrysWithPermissions] =
        await Promise.all([
            Collection.bulkFetchAllPermissions(ctx, collectionItems),
            Workbook.bulkFetchAllPermissions(ctx, workbookItems),
            SharedEntry.bulkFetchAllPermissions(ctx, sharedEntryItems),
        ]);

    const collectionsById: {[collectionId: string]: CollectionInstance} = {};
    const workbooksById: {[workbookId: string]: WorkbookInstance} = {};
    const sharedEntriesById: {[entryId: string]: SharedEntryInstance} = {};

    collectionsWithPermissions.forEach((item) => {
        collectionsById[item.model.collectionId] = item;
    });
    workbooksWithPermissions.forEach((item) => {
        workbooksById[item.model.workbookId] = item;
    });
    sharedEntrysWithPermissions.forEach((item) => {
        sharedEntriesById[item.model.entryId] = item;
    });

    return items.map((item) => {
        if (isSharedEntryModel(item.model)) {
            return sharedEntriesById[item.model.entryId];
        } else if (isWorkbookModel(item.model)) {
            return workbooksById[item.model.workbookId];
        } else {
            return collectionsById[item.model.collectionId];
        }
    });
}
