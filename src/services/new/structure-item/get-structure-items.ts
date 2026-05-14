import {AppError} from '@gravity-ui/nodekit';
import {raw} from 'objection';
import {z} from 'zod';

import {zc} from '../../../components/zod';
import {OrderBy, US_ERRORS} from '../../../const';
import {CollectionModel, CollectionModelColumn} from '../../../db/models/new/collection';
import {Entry, EntryColumn} from '../../../db/models/new/entry';
import {WorkbookModel, WorkbookModelColumn} from '../../../db/models/new/workbook';
import {CollectionPermission} from '../../../entities/collection';
import Utils from '../../../utils';
import {createPaginator} from '../../../utils/cursor-pagination';
import {getCollection} from '../collection';
import {getParentIds} from '../collection/utils';
import {ServiceArgs} from '../types';
import {getReplica} from '../utils';

import {getCollectionsQuery, getEntryQuery, getWorkbooksQuery, processPermissions} from './utils';

export type OrderField = 'title' | 'createdAt' | 'updatedAt';

export type OrderDirection = 'asc' | 'desc';

export type Mode = 'all' | 'onlyCollections' | 'onlyWorkbooks' | 'onlyEntries';

const WORKBOOK_SORT_FIELD_MAP: Record<OrderField, string> = {
    title: `${WorkbookModel.tableName}.${WorkbookModelColumn.SortTitle}`,
    createdAt: `${WorkbookModel.tableName}.${WorkbookModelColumn.CreatedAt}`,
    updatedAt: `${WorkbookModel.tableName}.${WorkbookModelColumn.UpdatedAt}`,
};
const WORKBOOK_TIEBREAKER = `${WorkbookModel.tableName}.${WorkbookModelColumn.WorkbookId}`;

const COLLECTION_SORT_FIELD_MAP: Record<OrderField, string> = {
    title: `${CollectionModel.tableName}.${CollectionModelColumn.SortTitle}`,
    createdAt: `${CollectionModel.tableName}.${CollectionModelColumn.CreatedAt}`,
    updatedAt: `${CollectionModel.tableName}.${CollectionModelColumn.UpdatedAt}`,
};
const COLLECTION_TIEBREAKER = `${CollectionModel.tableName}.${CollectionModelColumn.CollectionId}`;

const ENTRY_SORT_FIELD_MAP: Record<OrderField, string> = {
    title: `${Entry.tableName}.${EntryColumn.SortName}`,
    createdAt: `${Entry.tableName}.${EntryColumn.CreatedAt}`,
    updatedAt: `${Entry.tableName}.${EntryColumn.UpdatedAt}`,
};
const ENTRY_TIEBREAKER = `${Entry.tableName}.${EntryColumn.EntryId}`;

export interface GetStructureItemsContentArgs {
    collectionId: Nullable<string>;
    includePermissionsInfo?: boolean;
    filterString?: string;
    page?: string;
    pageSize?: number;
    orderField?: OrderField;
    orderDirection?: OrderDirection;
    onlyMy?: boolean;
    mode?: Mode;
}

export const getStructureItems = async (
    {ctx, trx, skipCheckPermissions = false}: ServiceArgs,
    args: GetStructureItemsContentArgs,
) => {
    const {
        collectionId,
        includePermissionsInfo = false,
        filterString,
        page,
        pageSize = 100,
        orderField = 'title',
        orderDirection = 'asc',
        onlyMy = false,
        mode = 'all',
    } = args;

    ctx.log('GET_STRUCTURE_ITEMS_START', {
        collectionId: collectionId ? Utils.encodeId(collectionId) : null,
        includePermissionsInfo,
        filterString,
        page,
        pageSize,
        orderField,
        orderDirection,
        onlyMy,
        mode,
    });

    const {accessServiceEnabled} = ctx.config;
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
                permission: CollectionPermission.Browse,
            });
        }
    }

    const allParentIds = collectionId ? [collectionId, ...parentIds] : [];
    const queryArgs = {collectionId, filterString, onlyMy};
    const direction = orderDirection === 'asc' ? OrderBy.Asc : OrderBy.Desc;
    const paginatorBase = {limit: pageSize, pageToken: page};
    const sortFieldValidator = orderField === 'title' ? z.string() : zc.stringSqlTimestampz();

    const applyPermissions = async (result: (CollectionModel | WorkbookModel | Entry)[]) => {
        if (result.length === 0) {
            return [];
        }
        return processPermissions({
            ctx,
            models: result,
            parentIds: allParentIds,
            skipCheckPermissions,
            includePermissionsInfo,
        });
    };

    let items: Awaited<ReturnType<typeof applyPermissions>> = [];
    let nextPageToken: string | undefined;

    if (mode === 'onlyWorkbooks') {
        const query = getWorkbooksQuery({ctx, trx}, queryArgs).timeout(
            CollectionModel.DEFAULT_QUERY_TIMEOUT,
        );

        const {result, nextPageToken: token} = await createPaginator({
            ...paginatorBase,
            sortFields: [
                {
                    field: WORKBOOK_SORT_FIELD_MAP[orderField],
                    direction,
                    validate: sortFieldValidator,
                },
            ],
            tiebreakerField: {field: WORKBOOK_TIEBREAKER, direction, validate: zc.stringBigInt()},
        }).execute(query);

        items = await applyPermissions(result);
        nextPageToken = token;
    } else if (mode === 'onlyCollections') {
        const query = getCollectionsQuery({ctx, trx}, queryArgs).timeout(
            CollectionModel.DEFAULT_QUERY_TIMEOUT,
        );

        const {result, nextPageToken: token} = await createPaginator({
            ...paginatorBase,
            sortFields: [
                {
                    field: COLLECTION_SORT_FIELD_MAP[orderField],
                    direction,
                    validate: sortFieldValidator,
                },
            ],
            tiebreakerField: {field: COLLECTION_TIEBREAKER, direction, validate: zc.stringBigInt()},
        }).execute(query);

        items = await applyPermissions(result);
        nextPageToken = token;
    } else if (mode === 'onlyEntries') {
        if (!collectionId) {
            throw new AppError('Collection ID is required for entries', {
                code: US_ERRORS.ENTRIES_REQUIRE_COLLECTION_ID,
            });
        }

        const query = getEntryQuery({ctx, trx}, {...queryArgs, collectionId}).timeout(
            CollectionModel.DEFAULT_QUERY_TIMEOUT,
        );

        const {result, nextPageToken: token} = await createPaginator({
            ...paginatorBase,
            sortFields: [
                {field: ENTRY_SORT_FIELD_MAP[orderField], direction, validate: sortFieldValidator},
            ],
            tiebreakerField: {field: ENTRY_TIEBREAKER, direction, validate: zc.stringBigInt()},
        }).execute(query);

        items = await applyPermissions(result);
        nextPageToken = token;
    } else {
        // mode === 'all'
        let unionQuery = getCollectionsQuery({ctx, trx}, queryArgs).unionAll(
            getWorkbooksQuery({ctx, trx}, queryArgs),
        );
        if (collectionId) {
            unionQuery = unionQuery.unionAll(
                getEntryQuery({ctx, trx}, {...queryArgs, collectionId}),
            );
        }

        // Wrap UNION in a subquery so rank/entity_id are real columns referenceable by the paginator
        const query = CollectionModel.query(targetTrx)
            .select('*')
            .from(raw('(?) as u', [unionQuery]))
            .timeout(CollectionModel.DEFAULT_QUERY_TIMEOUT);

        const {result, nextPageToken: token} = await createPaginator({
            ...paginatorBase,
            sortFields: [
                {field: 'rank', direction: OrderBy.Asc, validate: z.string()},
                {
                    field: orderField === 'title' ? 'sortTitle' : orderField,
                    direction,
                    validate: sortFieldValidator,
                },
            ],
            tiebreakerField: {field: 'entity_id', direction, validate: zc.stringBigInt()},
        }).execute(query);

        items = await applyPermissions(result);
        nextPageToken = token;
    }

    ctx.log('GET_STRUCTURE_ITEMS_FINISH', {
        itemsLength: items.length,
    });

    return {
        items,
        nextPageToken: nextPageToken ?? null,
    };
};
