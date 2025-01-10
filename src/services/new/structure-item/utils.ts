import {AppContext, AppError} from '@gravity-ui/nodekit';
import {raw} from 'objection';

import {Feature, isEnabledFeature} from '../../../components/features';
import {US_ERRORS} from '../../../const';
import {CollectionModel, CollectionModelColumn} from '../../../db/models/new/collection';
import {WorkbookModel, WorkbookModelColumn} from '../../../db/models/new/workbook';
import {CollectionPermission} from '../../../entities/collection';
import {WorkbookPermission} from '../../../entities/workbook';
import {CollectionInstance} from '../../../registry/common/entities/collection/types';
import {isWorkbookInstance} from '../../../registry/common/entities/structure-item/types';
import {WorkbookInstance} from '../../../registry/common/entities/workbook/types';
import Utils from '../../../utils';
import {ServiceArgs} from '../types';
import {getReplica} from '../utils';

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
            raw("'workbook' as ??", 'type'),
            WorkbookModelColumn.WorkbookId,
            WorkbookModelColumn.CollectionId,
            WorkbookModelColumn.Title,
            WorkbookModelColumn.SortTitle,
            WorkbookModelColumn.Description,
            raw('null as ??', 'parentId'),
            WorkbookModelColumn.TenantId,
            WorkbookModelColumn.CreatedBy,
            WorkbookModelColumn.CreatedAt,
            WorkbookModelColumn.UpdatedBy,
            WorkbookModelColumn.UpdatedAt,
            WorkbookModelColumn.Meta,
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
            raw("'collection' as ??", 'type'),
            raw('null as ??', 'workbookId'),
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

interface ProcessPermissionsArgs {
    ctx: AppContext;
    models: (CollectionModel | WorkbookModel)[];
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
    const {Workbook, Collection} = registry.common.classes.get();

    if (accessServiceEnabled && !skipCheckPermissions) {
        const checkedItems = await Promise.all(
            models.map(async (model: WorkbookModel | CollectionModel) => {
                const item = isWorkbookModel(model)
                    ? new Workbook({ctx, model})
                    : new Collection({ctx, model});

                try {
                    if (isWorkbookInstance(item)) {
                        await item.checkPermission({
                            parentIds,
                            permission: isEnabledFeature(ctx, Feature.UseLimitedView)
                                ? WorkbookPermission.LimitedView
                                : WorkbookPermission.View,
                        });
                    } else {
                        await item.checkPermission({
                            parentIds,
                            permission: isEnabledFeature(ctx, Feature.UseLimitedView)
                                ? CollectionPermission.LimitedView
                                : CollectionPermission.View,
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
            typeof Collection | typeof Workbook
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
        result = models.map((model: WorkbookModel | CollectionModel) => {
            const item = isWorkbookModel(model)
                ? new Workbook({ctx, model})
                : new Collection({ctx, model});

            if (includePermissionsInfo) {
                item.enableAllPermissions();
            }

            return item;
        });
    }
    return result;
};

const isWorkbookModel = (model: CollectionModel | WorkbookModel): model is WorkbookModel => {
    return 'workbookId' in model && Boolean(model.workbookId);
};
const isWorkbookItem = (item: {
    model: CollectionModel | WorkbookModel;
    parentIds: string[];
}): item is {model: WorkbookModel; parentIds: string[]} => {
    return isWorkbookModel(item.model);
};
const isCollectionItem = (item: {
    model: CollectionModel | WorkbookModel;
    parentIds: string[];
}): item is {model: CollectionModel; parentIds: string[]} => {
    return !isWorkbookItem(item);
};

const bulkFetchStructureItemsAllPermissions = async (
    ctx: AppContext,
    items: {model: CollectionModel | WorkbookModel; parentIds: string[]}[],
) => {
    if (items.length === 0) {
        return [];
    }

    const registry = ctx.get('registry');
    const {bulkFetchCollectionsAllPermissions, bulkFetchWorkbooksAllPermissions} =
        registry.common.functions.get();

    const collectionItems: {model: CollectionModel; parentIds: string[]}[] = [];
    const workbookItems: {model: WorkbookModel; parentIds: string[]}[] = [];
    items.forEach((item) => {
        if (isWorkbookItem(item)) {
            workbookItems.push(item);
        } else if (isCollectionItem(item)) {
            collectionItems.push(item);
        }
    });

    const [collectionsWithPermissions, workbooksWithPermissions] = await Promise.all([
        bulkFetchCollectionsAllPermissions(ctx, collectionItems),
        bulkFetchWorkbooksAllPermissions(ctx, workbookItems),
    ]);

    const collectionsById: {[collectionId: string]: CollectionInstance} = {};
    const workbooksById: {[workbookId: string]: WorkbookInstance} = {};

    collectionsWithPermissions.forEach((item) => {
        collectionsById[item.model.collectionId] = item;
    });
    workbooksWithPermissions.forEach((item) => {
        workbooksById[item.model.workbookId] = item;
    });

    return items.map((item) => {
        return isWorkbookModel(item.model)
            ? workbooksById[item.model.workbookId]
            : collectionsById[item.model.collectionId];
    });
};
