import {QueryBuilder, TransactionOrKnex} from 'objection';

import {Model} from '../..';
import {Entry, EntryColumn} from '../../models/new/entry';
import {Favorite, FavoriteColumn} from '../../models/new/favorite';
import {WorkbookModel} from '../../models/new/workbook';

const selectedFavoriteColumns = [
    FavoriteColumn.Alias,
    FavoriteColumn.DisplayAlias,
    FavoriteColumn.EntryId,
] as const;

const selectedEntryColumns = [
    EntryColumn.EntryId,
    EntryColumn.Scope,
    EntryColumn.Type,
    EntryColumn.DisplayKey,
    EntryColumn.CreatedBy,
    EntryColumn.UpdatedAt,
    EntryColumn.CreatedAt,
    EntryColumn.WorkbookId,
    EntryColumn.Hidden,
] as const;

const selectedWorkbookColumns = ['workbookId', 'title'] as const;

export type JoinedFavoriteEntryWorkbookColumns = Pick<
    Favorite,
    ArrayElement<typeof selectedFavoriteColumns>
> &
    Pick<Entry, ArrayElement<typeof selectedEntryColumns>> &
    Pick<WorkbookModel, ArrayElement<typeof selectedWorkbookColumns>>;

const selectedColumns = [
    ...selectedFavoriteColumns.map((col) => `${Favorite.tableName}.${col}`),
    ...selectedEntryColumns.map((col) => `${Entry.tableName}.${col}`),
    ...selectedWorkbookColumns.map((col) => `${WorkbookModel.tableName}.${col}`),
];
type ModifierFn = (
    builder: QueryBuilder<JoinedFavoriteEntryWorkbook, JoinedFavoriteEntryWorkbook[]>,
) => void;
type QueryWhereType = Record<string, unknown> | ModifierFn;
type JoinedFavoriteEntryFindArgs = {
    where: QueryWhereType | QueryWhereType[];
    orderByRaw?: string;
    modifier?: ModifierFn;
    page?: number;
    pageSize?: number;
    trx: TransactionOrKnex;
};

export class JoinedFavoriteEntryWorkbook extends Model {
    static get tableName() {
        return Favorite.tableName;
    }

    static get idColumn() {
        return Favorite.idColumn;
    }

    static findPage({
        where,
        orderByRaw,
        modifier,
        page = 0,
        pageSize = 100,
        trx,
    }: JoinedFavoriteEntryFindArgs) {
        const query = JoinedFavoriteEntryWorkbook.query(trx)
            .select(selectedColumns)
            .join(Entry.tableName, `${Favorite.tableName}.entryId`, `${Entry.tableName}.entryId`)
            .leftJoin(
                WorkbookModel.tableName,
                `${Entry.tableName}.workbookId`,
                `${WorkbookModel.tableName}.workbookId`,
            );

        if (Array.isArray(where)) {
            where.forEach((w) => {
                query.where(w);
            });
        } else {
            query.where(where);
        }

        if (orderByRaw) query.orderByRaw(orderByRaw);
        if (modifier) query.modify(modifier);

        return query
            .limit(pageSize)
            .offset(pageSize * page)
            .timeout(JoinedFavoriteEntryWorkbook.DEFAULT_QUERY_TIMEOUT) as unknown as Promise<
            JoinedFavoriteEntryWorkbookColumns[]
        >;
    }
}
