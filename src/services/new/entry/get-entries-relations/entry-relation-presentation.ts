import type {Knex} from 'knex';
import {QueryBuilder, TransactionOrKnex} from 'objection';

import {Model} from '../../../../db';
import {Entry, EntryColumn} from '../../../../db/models/new/entry';
import {EntryScope} from '../../../../db/models/new/entry/types';
import {Link, LinkColumn} from '../../../../db/models/new/link';

import {LinkDirection} from './types';

type EntryRelationArgs = {
    entryIds: string[];
    linkDirection: LinkDirection;
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
        {entryIds, tenantId, linkDirection, scope}: EntryRelationArgs,
    ): QueryBuilder<EntryRelation, EntryRelation[]> {
        const isToDirection = linkDirection === LinkDirection.To;

        const query = Entry.query(trx)
            .select(this.selectedColumns)
            .join(Link.tableName, this.joinLinks(isToDirection))
            .where(`${Entry.tableName}.${EntryColumn.TenantId}`, tenantId)
            .whereIn(
                isToDirection
                    ? `${Link.tableName}.${LinkColumn.ToId}`
                    : `${Link.tableName}.${LinkColumn.FromId}`,
                entryIds,
            )
            .where(`${Entry.tableName}.${EntryColumn.IsDeleted}`, false);

        if (scope) {
            query.where(`${Entry.tableName}.${EntryColumn.Scope}`, scope);
        }

        return query as unknown as QueryBuilder<EntryRelation, EntryRelation[]>;
    }

    protected static joinLinks(isToDirection: boolean) {
        return (builder: Knex.JoinClause) => {
            builder.on(
                isToDirection
                    ? `${Link.tableName}.${LinkColumn.FromId}`
                    : `${Link.tableName}.${LinkColumn.ToId}`,
                `${Entry.tableName}.${EntryColumn.EntryId}`,
            );
        };
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
}
