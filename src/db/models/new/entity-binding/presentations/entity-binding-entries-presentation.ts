import type {Knex} from 'knex';
import {QueryBuilder, RawBuilder, TransactionOrKnex, raw} from 'objection';

import {Model} from '../../../..';
import {Entry, EntryColumn} from '../../entry';
import {Favorite, FavoriteColumn} from '../../favorite';
import {RevisionModel, RevisionModelColumn} from '../../revision';
import {EntityBindingModel, EntityBindingModelColumn} from '../index';

export class EntityBindingEntriesPresentation extends Model {
    static get tableName() {
        return Entry.tableName;
    }

    static get idColumn() {
        return Entry.idColumn;
    }

    static getSelectQuery(trx: TransactionOrKnex, {userLogin}: {userLogin?: string} = {}) {
        let query = EntityBindingEntriesPresentation.query(trx)
            .select(this.getSelectedColumns(Boolean(userLogin)))
            .join(EntityBindingModel.tableName, this.joinEntityBinding)
            .join(RevisionModel.tableName, this.joinRevision);

        if (userLogin) {
            query = query.leftJoin(Favorite.tableName, this.leftJoinFavorite(userLogin));
        }

        return query as unknown as QueryBuilder<
            EntityBindingEntriesPresentation,
            EntityBindingEntriesPresentation[]
        >;
    }

    protected static joinEntityBinding(builder: Knex.JoinClause) {
        builder.on(
            `${EntityBindingModel.tableName}.${EntityBindingModelColumn.SourceId}`,
            `${Entry.tableName}.${EntryColumn.EntryId}`,
        );
    }

    protected static joinRevision(builder: Knex.JoinClause) {
        builder.on(
            raw('COALESCE(??, ??)', [
                `${Entry.tableName}.${EntryColumn.PublishedId}`,
                `${Entry.tableName}.${EntryColumn.SavedId}`,
            ]) as unknown as string,
            `${RevisionModel.tableName}.${RevisionModelColumn.RevId}`,
        );
    }

    protected static leftJoinFavorite(userLogin: string) {
        return (builder: Knex.JoinClause) => {
            builder
                .on(`${Favorite.tableName}.entryId`, `${Entry.tableName}.entryId`)
                .andOnIn(`${Favorite.tableName}.${FavoriteColumn.Login}`, [userLogin]);
        };
    }

    protected static getSelectedColumns(includeFavorite: boolean) {
        const baseColumns: (string | RawBuilder)[] = [
            `${EntityBindingModel.tableName}.${EntityBindingModelColumn.SourceId}`,
            `${EntityBindingModel.tableName}.${EntityBindingModelColumn.TargetId}`,
            `${EntityBindingModel.tableName}.${EntityBindingModelColumn.TargetType}`,
            `${EntityBindingModel.tableName}.${EntityBindingModelColumn.IsDelegated}`,

            `${Entry.tableName}.${EntryColumn.EntryId}`,
            `${Entry.tableName}.${EntryColumn.Scope}`,
            `${Entry.tableName}.${EntryColumn.Type}`,
            `${Entry.tableName}.${EntryColumn.Key}`,
            `${Entry.tableName}.${EntryColumn.DisplayKey}`,
            `${Entry.tableName}.${EntryColumn.InnerMeta}`,
            `${Entry.tableName}.${EntryColumn.CreatedBy}`,
            `${Entry.tableName}.${EntryColumn.CreatedAt}`,
            `${Entry.tableName}.${EntryColumn.IsDeleted}`,
            `${Entry.tableName}.${EntryColumn.DeletedAt}`,
            `${Entry.tableName}.${EntryColumn.Hidden}`,
            `${Entry.tableName}.${EntryColumn.SavedId}`,
            `${Entry.tableName}.${EntryColumn.PublishedId}`,
            `${Entry.tableName}.${EntryColumn.TenantId}`,
            `${Entry.tableName}.${EntryColumn.Public}`,
            `${Entry.tableName}.${EntryColumn.UnversionedData}`,
            `${Entry.tableName}.${EntryColumn.WorkbookId}`,
            `${Entry.tableName}.${EntryColumn.CollectionId}`,
            `${Entry.tableName}.${EntryColumn.Mirrored}`,

            `${RevisionModel.tableName}.${RevisionModelColumn.Data}`,
            `${RevisionModel.tableName}.${RevisionModelColumn.Meta}`,
            `${RevisionModel.tableName}.${RevisionModelColumn.Annotation}`,
            `${RevisionModel.tableName}.${RevisionModelColumn.UpdatedBy}`,
            `${RevisionModel.tableName}.${RevisionModelColumn.UpdatedAt}`,
            `${RevisionModel.tableName}.${RevisionModelColumn.RevId}`,
            `${RevisionModel.tableName}.${RevisionModelColumn.Links}`,
        ];

        if (includeFavorite) {
            baseColumns.push(
                raw(`CASE WHEN ?? IS NULL THEN FALSE ELSE TRUE END AS is_favorite`, [
                    `${Favorite.tableName}.${FavoriteColumn.EntryId}`,
                ]),
            );
        }

        return baseColumns;
    }

    [EntityBindingModelColumn.SourceId]!: EntityBindingModel[typeof EntityBindingModelColumn.SourceId];
    [EntityBindingModelColumn.TargetId]!: EntityBindingModel[typeof EntityBindingModelColumn.TargetId];
    [EntityBindingModelColumn.TargetType]!: EntityBindingModel[typeof EntityBindingModelColumn.TargetType];
    [EntityBindingModelColumn.IsDelegated]!: EntityBindingModel[typeof EntityBindingModelColumn.IsDelegated];

    [EntryColumn.EntryId]!: Entry[typeof EntryColumn.EntryId];
    [EntryColumn.Scope]!: Entry[typeof EntryColumn.Scope];
    [EntryColumn.Type]!: Entry[typeof EntryColumn.Type];
    [EntryColumn.Key]!: Entry[typeof EntryColumn.Key];
    [EntryColumn.DisplayKey]!: Entry[typeof EntryColumn.DisplayKey];
    [EntryColumn.InnerMeta]!: Entry[typeof EntryColumn.InnerMeta];
    [EntryColumn.CreatedBy]!: Entry[typeof EntryColumn.CreatedBy];
    [EntryColumn.CreatedAt]!: Entry[typeof EntryColumn.CreatedAt];
    [EntryColumn.IsDeleted]!: Entry[typeof EntryColumn.IsDeleted];
    [EntryColumn.DeletedAt]!: Entry[typeof EntryColumn.DeletedAt];
    [EntryColumn.Hidden]!: Entry[typeof EntryColumn.Hidden];
    [EntryColumn.SavedId]!: Entry[typeof EntryColumn.SavedId];
    [EntryColumn.PublishedId]!: Entry[typeof EntryColumn.PublishedId];
    [EntryColumn.TenantId]!: Entry[typeof EntryColumn.TenantId];
    [EntryColumn.Public]!: Entry[typeof EntryColumn.Public];
    [EntryColumn.UnversionedData]!: Entry[typeof EntryColumn.UnversionedData];
    [EntryColumn.WorkbookId]!: Entry[typeof EntryColumn.WorkbookId];
    [EntryColumn.CollectionId]!: Entry[typeof EntryColumn.CollectionId];
    [EntryColumn.Mirrored]!: Entry[typeof EntryColumn.Mirrored];

    [RevisionModelColumn.Data]!: RevisionModel[typeof RevisionModelColumn.Data];
    [RevisionModelColumn.Meta]!: RevisionModel[typeof RevisionModelColumn.Meta];
    [RevisionModelColumn.Annotation]!: RevisionModel[typeof RevisionModelColumn.Annotation];
    [RevisionModelColumn.UpdatedBy]!: RevisionModel[typeof RevisionModelColumn.UpdatedBy];
    [RevisionModelColumn.UpdatedAt]!: RevisionModel[typeof RevisionModelColumn.UpdatedAt];
    [RevisionModelColumn.RevId]!: RevisionModel[typeof RevisionModelColumn.RevId];
    [RevisionModelColumn.Links]!: RevisionModel[typeof RevisionModelColumn.Links];

    isFavorite?: boolean;
}
