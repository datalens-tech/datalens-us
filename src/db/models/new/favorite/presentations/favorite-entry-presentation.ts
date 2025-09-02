import type {Knex} from 'knex';
import {QueryBuilder, TransactionOrKnex, raw} from 'objection';

import {Model} from '../../../..';
import {Entry, EntryColumn} from '../../entry';
import {WorkbookModel as Workbook, WorkbookModelColumn as WorkbookColumn} from '../../workbook';
import {Favorite, FavoriteColumn} from '../index';

export class FavoriteEntryPresentation extends Model {
    static get tableName() {
        return Favorite.tableName;
    }

    static get idColumn() {
        return Favorite.idColumn;
    }

    static getSelectQuery(trx: TransactionOrKnex) {
        const query = Favorite.query(trx)
            .select(this.selectedColumns)
            .join(Entry.tableName, this.joinEntry)
            .leftJoin(Workbook.tableName, this.leftJoinWorkbook);

        return query as unknown as QueryBuilder<
            FavoriteEntryPresentation,
            FavoriteEntryPresentation[]
        >;
    }

    protected static joinEntry(builder: Knex.JoinClause) {
        builder.on(
            `${Favorite.tableName}.${FavoriteColumn.EntryId}`,
            `${Entry.tableName}.${EntryColumn.EntryId}`,
        );
    }

    protected static leftJoinWorkbook(builder: Knex.JoinClause) {
        builder.on(
            `${Entry.tableName}.${EntryColumn.WorkbookId}`,
            `${Workbook.tableName}.${WorkbookColumn.WorkbookId}`,
        );
    }

    protected static get selectedColumns() {
        return [
            `${Favorite.tableName}.${FavoriteColumn.EntryId}`,
            `${Favorite.tableName}.${FavoriteColumn.Alias}`,
            `${Favorite.tableName}.${FavoriteColumn.DisplayAlias}`,

            `${Entry.tableName}.${EntryColumn.Scope}`,
            `${Entry.tableName}.${EntryColumn.Type}`,
            `${Entry.tableName}.${EntryColumn.Key}`,
            `${Entry.tableName}.${EntryColumn.DisplayKey}`,
            `${Entry.tableName}.${EntryColumn.CreatedBy}`,
            `${Entry.tableName}.${EntryColumn.CreatedAt}`,
            `${Entry.tableName}.${EntryColumn.UpdatedAt}`,
            `${Entry.tableName}.${EntryColumn.Hidden}`,
            `${Entry.tableName}.${EntryColumn.WorkbookId}`,
            `${Entry.tableName}.${EntryColumn.CollectionId}`,

            raw(`${Workbook.tableName}.${WorkbookColumn.Title} AS workbook_title`),
        ];
    }

    [FavoriteColumn.EntryId]!: Favorite[typeof FavoriteColumn.EntryId];
    [FavoriteColumn.Alias]!: Favorite[typeof FavoriteColumn.Alias];
    [FavoriteColumn.DisplayAlias]!: Favorite[typeof FavoriteColumn.DisplayAlias];

    [EntryColumn.Scope]!: Entry[typeof EntryColumn.Scope];
    [EntryColumn.Type]!: Entry[typeof EntryColumn.Type];
    [EntryColumn.Key]!: Entry[typeof EntryColumn.Key];
    [EntryColumn.DisplayKey]!: Entry[typeof EntryColumn.DisplayKey];
    [EntryColumn.CreatedBy]!: Entry[typeof EntryColumn.CreatedBy];
    [EntryColumn.CreatedAt]!: Entry[typeof EntryColumn.CreatedAt];
    [EntryColumn.UpdatedAt]!: Entry[typeof EntryColumn.UpdatedAt];
    [EntryColumn.Hidden]!: Entry[typeof EntryColumn.Hidden];
    [EntryColumn.WorkbookId]!: Entry[typeof EntryColumn.WorkbookId];
    [EntryColumn.CollectionId]!: Entry[typeof EntryColumn.CollectionId];

    workbookTitle!: Nullable<Workbook[typeof WorkbookColumn.Title]>;
}
