import {AppError} from '@gravity-ui/nodekit';

import {Feature, isEnabledFeature} from '../../../components/features';
import {makeSchemaValidator} from '../../../components/validation-schema-compiler';
import {US_ERRORS} from '../../../const';
import {CollectionModel, CollectionModelColumn} from '../../../db/models/new/collection';
import {CollectionPermission} from '../../../entities/collection';
import Utils from '../../../utils';
import {ServiceArgs} from '../types';
import {getReplica} from '../utils';
import {getWorkbooksList} from '../workbook';

import {getCollection} from './get-collection';
import {getParentIds} from './utils/get-parents';

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
        collectionsPage: {
            type: ['number', 'null'],
        },
        workbooksPage: {
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

export interface GetCollectionContentArgs {
    collectionId: Nullable<string>;
    includePermissionsInfo?: boolean;
    filterString?: string;
    collectionsPage?: Nullable<number>;
    workbooksPage?: Nullable<number>;
    pageSize?: number;
    orderField?: OrderField;
    orderDirection?: OrderDirection;
    onlyMy?: boolean;
    mode?: Mode;
}

// eslint-disable-next-line complexity
export const getCollectionContent = async (
    {ctx, trx, skipValidation = false, skipCheckPermissions = false}: ServiceArgs,
    args: GetCollectionContentArgs,
) => {
    const {
        collectionId,
        includePermissionsInfo = false,
        filterString,
        collectionsPage = 0,
        workbooksPage = 0,
        pageSize = 100,
        orderField = 'title',
        orderDirection = 'asc',
        onlyMy = false,
        mode = 'all',
    } = args;

    ctx.log('GET_COLLECTION_CONTENT_START', {
        collectionId: collectionId ? Utils.encodeId(collectionId) : null,
        includePermissionsInfo,
        filterString,
        collectionsPage,
        workbooksPage,
        pageSize,
        orderField,
        orderDirection,
        onlyMy,
        mode,
    });

    if (!skipValidation) {
        validateArgs(args);
    }

    const registry = ctx.get('registry');
    const {accessServiceEnabled} = ctx.config;
    const {Workbook, Collection} = registry.common.classes.get();
    const {bulkFetchCollectionsAllPermissions} = registry.common.functions.get();

    const {
        tenantId,
        projectId,
        user: {userId},
    } = ctx.get('info');

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

    let collections: InstanceType<typeof Collection>[] = [];
    let collectionsNextPageToken: Optional<string>;

    if (collectionsPage !== null && (mode === 'all' || mode === 'onlyCollections')) {
        const curCollectionsPage = await CollectionModel.query(targetTrx)
            .select()
            .where({
                [CollectionModelColumn.TenantId]: tenantId,
                [CollectionModelColumn.ProjectId]: projectId,
                [CollectionModelColumn.DeletedAt]: null,
                [CollectionModelColumn.ParentId]: collectionId,
            })
            .where((qb) => {
                if (filterString) {
                    const preparedFilterString = Utils.escapeStringForLike(
                        filterString.toLowerCase(),
                    );
                    qb.where(CollectionModelColumn.TitleLower, 'LIKE', `%${preparedFilterString}%`);
                }
                if (onlyMy) {
                    qb.where({
                        [CollectionModelColumn.CreatedBy]: userId,
                    });
                }
            })
            .orderBy(
                orderField === 'title' ? CollectionModelColumn.SortTitle : orderField,
                orderDirection,
            )
            .limit(pageSize)
            .offset(pageSize * collectionsPage)
            .timeout(CollectionModel.DEFAULT_QUERY_TIMEOUT);

        collectionsNextPageToken = Utils.getOptimisticNextPageToken({
            page: collectionsPage,
            pageSize,
            curPage: curCollectionsPage,
        });

        if (curCollectionsPage.length > 0) {
            if (accessServiceEnabled && !skipCheckPermissions) {
                const contentParentIds = collectionId ? [collectionId, ...parentIds] : [];

                const checkedCollections = await Promise.all(
                    curCollectionsPage.map(async (model) => {
                        const collection = new Collection({ctx, model});

                        try {
                            await collection.checkPermission({
                                parentIds: contentParentIds,
                                permission: isEnabledFeature(ctx, Feature.UseLimitedView)
                                    ? CollectionPermission.LimitedView
                                    : CollectionPermission.View,
                            });

                            return collection;
                        } catch (error) {
                            const err = error as AppError;

                            if (err.code === US_ERRORS.ACCESS_SERVICE_PERMISSION_DENIED) {
                                return null;
                            }

                            throw error;
                        }
                    }),
                );

                collections = checkedCollections.filter(
                    (collection) => collection !== null,
                ) as InstanceType<typeof Collection>[];

                if (includePermissionsInfo) {
                    collections = await bulkFetchCollectionsAllPermissions(
                        ctx,
                        collections.map((collection) => ({
                            model: collection.model,
                            parentIds: contentParentIds,
                        })),
                    );
                }
            } else {
                collections = curCollectionsPage.map((model) => {
                    const collection = new Collection({ctx, model});

                    if (includePermissionsInfo) {
                        collection.enableAllPermissions();
                    }

                    return collection;
                });
            }
        }
    }

    let workbooks: InstanceType<typeof Workbook>[] = [];
    let workbooksNextPageToken: Optional<string>;

    if (workbooksPage !== null && (mode === 'all' || mode === 'onlyWorkbooks')) {
        const result = await getWorkbooksList(
            {ctx, trx, skipValidation, skipCheckPermissions},
            {
                collectionId,
                filterString,
                page: workbooksPage,
                pageSize,
                orderField,
                orderDirection,
                includePermissionsInfo,
                onlyMy,
            },
        );
        workbooks = result.workbooks;
        workbooksNextPageToken = result.nextPageToken;
    }

    ctx.log('GET_COLLECTION_CONTENT_FINISH', {
        collectionsLength: collections.length,
        workbooksLength: workbooks.length,
    });

    return {
        collections,
        workbooks,
        collectionsNextPageToken: collectionsNextPageToken ?? null,
        workbooksNextPageToken: workbooksNextPageToken ?? null,
    };
};
