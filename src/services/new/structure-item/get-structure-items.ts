import {ServiceArgs} from '../types';
import {getReplica} from '../utils';
import {makeSchemaValidator} from '../../../components/validation-schema-compiler';
import {CollectionPermission} from '../../../entities/collection';
import {CollectionModel} from '../../../db/models/new/collection';
import Utils, {logInfo} from '../../../utils';
import {registry} from '../../../registry';
import {Feature, isEnabledFeature} from '../../../components/features';
import {getCollection} from '../collection';
import {getParentIds} from '../collection/utils';
import {getCollectionsQuery, getWorkbooksQuery, processPermissions} from './utils';

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
        page: {
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
    page?: Nullable<number>;
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
        page = 0,
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
        page: page,
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

    if (page !== null) {
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

        const curPage = await query
            .orderBy(orderField === 'title' ? 'sortTitle' : orderField, orderDirection)
            .page(page, pageSize)
            .timeout(CollectionModel.DEFAULT_QUERY_TIMEOUT);

        nextPageToken = Utils.getNextPageToken(page, pageSize, curPage.total);

        if (curPage.results.length > 0) {
            const allParentIds = collectionId ? [collectionId, ...parentIds] : [];
            items = await processPermissions({
                ctx,
                models: curPage.results,
                parentIds: allParentIds,
                skipCheckPermissions,
                includePermissionsInfo,
            });
        }
    }

    ctx.log('GET_STRUCTURE_ITEMS_FINISH', {
        itemsLength: items.length,
    });

    return {
        items,
        nextPageToken: nextPageToken ?? null,
    };
};
