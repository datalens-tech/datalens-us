import type {Knex} from 'knex';
import {QueryBuilder, TransactionOrKnex, raw} from 'objection';

import {Model} from '../../../../db';
import {Entry, EntryColumn} from '../../../../db/models/new/entry';
import {EntryScope} from '../../../../db/models/new/entry/types';
import {Link, LinkColumn} from '../../../../db/models/new/link';
import {RevisionModel, RevisionModelColumn} from '../../../../db/models/new/revision';

import {SearchDirection} from './types';

type EntryRelationArgs = {
    entryIds: string[];
    searchDirection: SearchDirection;
    tenantId: string;
    scope?: EntryScope;
};

export class EntryRelation extends Model {
    static get tableName() {
        return Entry.tableName;
    }

    static get idColumn() {
        return Entry.idColumn;
    }

    static getSelectQuery(
        trx: TransactionOrKnex,
        {entryIds, tenantId, searchDirection, scope}: EntryRelationArgs,
    ): QueryBuilder<EntryRelation, EntryRelation[]> {
        const isChildrenSearch = searchDirection === SearchDirection.Children;

        const query = Entry.query(trx)
            .select(this.selectedColumns)
            .join(Link.tableName, this.joinLinks(isChildrenSearch))
            .join(RevisionModel.tableName, this.joinRevision)
            .where(`${Entry.tableName}.${EntryColumn.TenantId}`, tenantId)
            .whereIn(
                isChildrenSearch
                    ? `${Link.tableName}.${LinkColumn.FromId}`
                    : `${Link.tableName}.${LinkColumn.ToId}`,
                entryIds,
            )
            .where(`${Entry.tableName}.${EntryColumn.IsDeleted}`, false);

        if (scope) {
            query.where(`${Entry.tableName}.${EntryColumn.Scope}`, scope);
        }

        return query as unknown as QueryBuilder<EntryRelation, EntryRelation[]>;
    }

    protected static joinLinks(isChildrenSearch: boolean) {
        return (builder: Knex.JoinClause) => {
            builder.on(
                isChildrenSearch
                    ? `${Link.tableName}.${LinkColumn.ToId}`
                    : `${Link.tableName}.${LinkColumn.FromId}`,
                `${Entry.tableName}.${EntryColumn.EntryId}`,
            );
        };
    }

    protected static joinRevision(builder: Knex.JoinClause) {
        builder.on(
            raw('COALESCE(??, ??)', [
                `${Entry.tableName}.${EntryColumn.PublishedId}`,
                `${Entry.tableName}.${EntryColumn.SavedId}`,
            ]) as unknown as string,
            '=',
            `${RevisionModel.tableName}.${RevisionModelColumn.RevId}`,
        );
    }

    protected static get selectedColumns() {
        return [
            `${Entry.tableName}.${EntryColumn.EntryId}`,
            `${Entry.tableName}.${EntryColumn.Key}`,
            `${Entry.tableName}.${EntryColumn.Scope}`,
            `${Entry.tableName}.${EntryColumn.Type}`,
            `${Entry.tableName}.${EntryColumn.CreatedAt}`,
            `${Entry.tableName}.${EntryColumn.Public}`,
            `${Entry.tableName}.${EntryColumn.TenantId}`,
            `${Entry.tableName}.${EntryColumn.WorkbookId}`,
            `${Entry.tableName}.${EntryColumn.CollectionId}`,

            `${RevisionModel.tableName}.${RevisionModelColumn.Meta}`,
            `${RevisionModel.tableName}.${RevisionModelColumn.Links}`,
        ];
    }

    [EntryColumn.EntryId]!: Entry[typeof EntryColumn.EntryId];
    [EntryColumn.Key]!: Entry[typeof EntryColumn.Key];
    [EntryColumn.Scope]!: Entry[typeof EntryColumn.Scope];
    [EntryColumn.Type]!: Entry[typeof EntryColumn.Type];
    [EntryColumn.CreatedAt]!: Entry[typeof EntryColumn.CreatedAt];
    [EntryColumn.Public]!: Entry[typeof EntryColumn.Public];
    [EntryColumn.TenantId]!: Entry[typeof EntryColumn.TenantId];
    [EntryColumn.WorkbookId]!: Entry[typeof EntryColumn.WorkbookId];
    [EntryColumn.CollectionId]!: Entry[typeof EntryColumn.CollectionId];

    [RevisionModelColumn.Meta]!: RevisionModel[typeof RevisionModelColumn.Meta];
    [RevisionModelColumn.Links]!: RevisionModel[typeof RevisionModelColumn.Links];
}
