import {AppContext, AppError} from '@gravity-ui/nodekit';
import {ServiceArgs} from '../types';
import {getReplica} from '../utils';
import {makeSchemaValidator} from '../../../components/validation-schema-compiler';
import {US_ERRORS} from '../../../const';
import {CollectionPermission} from '../../../entities/collection';
import {CollectionModel} from '../../../db/models/new/collection';
import Utils, {logInfo} from '../../../utils';
import {registry} from '../../../registry';
import {Feature, isEnabledFeature} from '../../../components/features';
import {getCollection, getParentIds} from '../../../../api/services';
import {WorkbookModel} from '../../../db/models/new/workbook';
import {getWorkbooksQuery} from './get-workbooks-query';
import {getCollectionsQuery} from './get-collections-query';
import {isWorkbookInstance} from '../../../registry/common/entities/structure-item/types';
import {WorkbookPermission} from '../../../../api/entities';
import {CollectionInstance} from '../../../registry/common/entities/collection/types';
import {WorkbookInstance} from '../../../registry/common/entities/workbook/types';

const validateArgs = makeSchemaValidator({
    type: 'object',
    required: ['collectionId'],
    properties: {
        collectionId: {
            type: ['string', 'null'],
        },
        includePermissionsInfo: {
            type: 'boolean',
        },
        filterString: {
            type: 'string',
        },
        itemsPage: {
            type: ['number', 'null'],
        },
        pageSize: {
            type: 'number',
        },
        orderField: {
            type: 'string',
            enum: ['title', 'createdAt', 'updatedAt'],
        },
        orderDirection: {
            type: 'string',
            enum: ['asc', 'desc'],
        },
    },
});

export type OrderField = 'title' | 'createdAt' | 'updatedAt';

export type OrderDirection = 'asc' | 'desc';

export type Mode = 'all' | 'onlyCollections' | 'onlyWorkbooks';

export interface GetStructureItemsContentArgs {
    collectionId: Nullable<string>;
    includePermissionsInfo?: boolean;
    filterString?: string;
    itemsPage?: Nullable<number>;
    pageSize?: number;
    orderField?: OrderField;
    orderDirection?: OrderDirection;
    onlyMy?: boolean;
    mode?: Mode;
}

// eslint-disable-next-line complexity
export const getStructureItems = async (
    {ctx, trx, skipValidation = false, skipCheckPermissions = false}: ServiceArgs,
    args: GetStructureItemsContentArgs,
) => {
    const {
        collectionId,
        includePermissionsInfo = false,
        filterString,
        itemsPage = 0,
        pageSize = 100,
        orderField = 'title',
        orderDirection = 'asc',
        onlyMy = false,
        mode = 'all',
    } = args;

    logInfo(ctx, 'GET_STRUCTURE_ITEMS_START', {
        collectionId: collectionId ? Utils.encodeId(collectionId) : null,
        includePermissionsInfo,
        filterString,
        itemsPage,
        pageSize,
        orderField,
        orderDirection,
        onlyMy,
        mode,
    });

    if (!skipValidation) {
        validateArgs(args);
    }

    const {accessServiceEnabled} = ctx.config;
    const {Workbook, Collection} = registry.common.classes.get();

    const targetTrx = getReplica(trx);

    let parentIds: string[] = [];
    if (collectionId) {
        const collection = await getCollection(
            {ctx, trx: targetTrx, skipValidation: true, skipCheckPermissions},
            {collectionId},
        );

        if (accessServiceEnabled && !skipCheckPermissions) {
            if (collection.model.parentId !== null) {
                parentIds = await getParentIds({
                    ctx,
                    trx: targetTrx,
                    collectionId: collection.model.parentId,
                });
            }

            await collection.checkPermission({
                parentIds,
                permission: isEnabledFeature(ctx, Feature.UseLimitedView)
                    ? CollectionPermission.LimitedView
                    : CollectionPermission.View,
            });
        }
    }

    let items: InstanceType<typeof Collection | typeof Workbook>[] = [];
    let nextPageToken: Optional<string>;

    if (itemsPage !== null) {
        let query;

        const queryArgs = {collectionId, filterString, onlyMy};
        if (mode === 'onlyWorkbooks') {
            query = getWorkbooksQuery({ctx, trx}, queryArgs);
        } else if (mode === 'onlyCollections') {
            query = getCollectionsQuery({ctx, trx}, queryArgs);
        } else {
            // All
            query = getCollectionsQuery({ctx, trx}, queryArgs)
                .unionAll(getWorkbooksQuery({ctx, trx}, queryArgs))
                .orderBy('type', 'asc');
        }

        const curItemsPage = await query
            .orderBy(orderField === 'title' ? 'sortTitle' : orderField, orderDirection)
            .page(itemsPage, pageSize)
            .timeout(CollectionModel.DEFAULT_QUERY_TIMEOUT);

        nextPageToken = Utils.getNextPageToken(itemsPage, pageSize, curItemsPage.total);

        if (curItemsPage.results.length > 0) {
            const allParentIds = collectionId ? [collectionId, ...parentIds] : [];
            items = await processPermissions({
                ctx,
                models: curItemsPage.results,
                parentIds: allParentIds,
                skipCheckPermissions,
                includePermissionsInfo,
            });
        }
    }

    logInfo(ctx, 'GET_STRUCTURE_ITEMS_FINISH', {
        itemsLength: items.length,
    });

    return {
        items,
        nextPageToken: nextPageToken ?? null,
    };
};

interface ProcessPermissionsArgs {
    ctx: AppContext;
    models: (CollectionModel | WorkbookModel)[];
    parentIds: string[];
    skipCheckPermissions: boolean;
    includePermissionsInfo: boolean;
}

const processPermissions = async ({
    ctx,
    models,
    parentIds,
    skipCheckPermissions,
    includePermissionsInfo,
}: ProcessPermissionsArgs) => {
    let result;

    const {accessServiceEnabled} = ctx.config;
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

    const collectionsById: {[k: string]: CollectionInstance} = {};
    const workbooksById: {[k: string]: WorkbookInstance} = {};

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
