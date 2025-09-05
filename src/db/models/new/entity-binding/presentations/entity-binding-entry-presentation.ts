import {QueryBuilder, TransactionOrKnex} from 'objection';

import {Model} from '../../../..';
import {Entry, EntryColumn} from '../../entry';
import {EntityBindingModel, EntityBindingModelColumn} from '../index';
import {EntityBindingTargetType} from '../types';

export interface TargetFilter {
    targetType: `${EntityBindingTargetType}`;
    targetId: string;
}

export class EntityBindingEntryPresentation extends Model {
    static getSelectQuery(
        trx: TransactionOrKnex,
        {targetFilters}: {targetFilters: TargetFilter[]},
    ) {
        const query = Entry.query(trx)
            .select(this.selectedColumns)
            .leftJoin(
                (builder) => {
                    builder
                        .select()
                        .from(EntityBindingModel.tableName)
                        .where((whereBuilder) => {
                            targetFilters.forEach((filter, index) => {
                                const {targetType, targetId} = filter;
                                const whereMethod = index === 0 ? 'where' : 'orWhere';

                                whereBuilder[whereMethod]((subBuilder) => {
                                    subBuilder
                                        .where(EntityBindingModelColumn.TargetType, targetType)
                                        .where(EntityBindingModelColumn.TargetId, targetId);
                                });
                            });
                        })
                        .as('eb');
                },
                (builder) => {
                    builder.on(
                        `${Entry.tableName}.${EntryColumn.EntryId}`,
                        `eb.${EntityBindingModelColumn.SourceId}`,
                    );
                },
            );

        return query as unknown as QueryBuilder<
            EntityBindingEntryPresentation,
            EntityBindingEntryPresentation[]
        >;
    }

    protected static get selectedColumns() {
        return [
            `${Entry.tableName}.${EntryColumn.EntryId}`,
            `${Entry.tableName}.${EntryColumn.WorkbookId}`,
            `${Entry.tableName}.${EntryColumn.CollectionId}`,

            `eb.${EntityBindingModelColumn.SourceId}`,
            `eb.${EntityBindingModelColumn.TargetId}`,
            `eb.${EntityBindingModelColumn.TargetType}`,
            `eb.${EntityBindingModelColumn.IsDelegated}`,
        ];
    }

    [EntryColumn.EntryId]!: Entry[typeof EntryColumn.EntryId];
    [EntryColumn.WorkbookId]!: Entry[typeof EntryColumn.WorkbookId];
    [EntryColumn.CollectionId]!: Entry[typeof EntryColumn.CollectionId];

    [EntityBindingModelColumn.SourceId]!: Nullable<
        EntityBindingModel[typeof EntityBindingModelColumn.SourceId]
    >;
    [EntityBindingModelColumn.TargetId]!: Nullable<
        EntityBindingModel[typeof EntityBindingModelColumn.TargetId]
    >;
    [EntityBindingModelColumn.TargetType]!: Nullable<
        EntityBindingModel[typeof EntityBindingModelColumn.TargetType]
    >;
    [EntityBindingModelColumn.IsDelegated]!: Nullable<
        EntityBindingModel[typeof EntityBindingModelColumn.IsDelegated]
    >;
}
