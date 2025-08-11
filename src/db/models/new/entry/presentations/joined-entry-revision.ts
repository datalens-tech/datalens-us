import type {Knex} from 'knex';
import {QueryBuilder, TransactionOrKnex, raw} from 'objection';

import {Entry, EntryColumn} from '../';
import {Model} from '../../../..';
import {RevisionModel as Revision, RevisionModelColumn as RevisionColumn} from '../../revision';

export type RevisionBranch = 'saved' | 'published';

export class JoinedEntryRevision extends Model {
    static get tableName() {
        return Entry.tableName;
    }

    static get idColumn() {
        return Entry.idColumn;
    }

    static _joinRevision({revId, branch}: {revId?: string; branch?: RevisionBranch}) {
        return (builder: Knex.JoinClause) => {
            if (revId) {
                builder.on(
                    `${Entry.tableName}.${EntryColumn.EntryId}`,
                    `${Revision.tableName}.${RevisionColumn.EntryId}`,
                );
            } else if (branch === 'saved') {
                builder.on(
                    `${Entry.tableName}.${EntryColumn.SavedId}`,
                    `${Revision.tableName}.${RevisionColumn.RevId}`,
                );
            } else if (branch === 'published') {
                builder.on(
                    `${Entry.tableName}.${EntryColumn.PublishedId}`,
                    `${Revision.tableName}.${RevisionColumn.RevId}`,
                );
            } else {
                builder.on(
                    raw(`COALESCE(??, ??)`, [
                        `${Entry.tableName}.${EntryColumn.PublishedId}`,
                        `${Entry.tableName}.${EntryColumn.SavedId}`,
                    ]) as unknown as string, // TODO: fix type
                    `${Revision.tableName}.${RevisionColumn.RevId}`,
                );
            }
        };
    }

    static get _selectedColumns() {
        return [
            `${Entry.tableName}.${EntryColumn.Scope}`,
            `${Entry.tableName}.${EntryColumn.Type}`,
            `${Entry.tableName}.${EntryColumn.Key}`,
            `${Entry.tableName}.${EntryColumn.InnerMeta}`,
            `${Entry.tableName}.${EntryColumn.CreatedBy}`,
            `${Entry.tableName}.${EntryColumn.CreatedAt}`,
            `${Entry.tableName}.${EntryColumn.IsDeleted}`,
            `${Entry.tableName}.${EntryColumn.DeletedAt}`,
            `${Entry.tableName}.${EntryColumn.Hidden}`,
            `${Entry.tableName}.${EntryColumn.DisplayKey}`,
            `${Entry.tableName}.${EntryColumn.EntryId}`,
            `${Entry.tableName}.${EntryColumn.SavedId}`,
            `${Entry.tableName}.${EntryColumn.PublishedId}`,
            `${Entry.tableName}.${EntryColumn.TenantId}`,
            `${Entry.tableName}.${EntryColumn.Name}`,
            `${Entry.tableName}.${EntryColumn.SortName}`,
            `${Entry.tableName}.${EntryColumn.Public}`,
            `${Entry.tableName}.${EntryColumn.UnversionedData}`,
            `${Entry.tableName}.${EntryColumn.WorkbookId}`,
            `${Entry.tableName}.${EntryColumn.Mirrored}`,

            `${Revision.tableName}.${RevisionColumn.Data}`,
            `${Revision.tableName}.${RevisionColumn.Meta}`,
            `${Revision.tableName}.${RevisionColumn.UpdatedBy}`,
            `${Revision.tableName}.${RevisionColumn.UpdatedAt}`,
            `${Revision.tableName}.${RevisionColumn.RevId}`,
            `${Revision.tableName}.${RevisionColumn.Links}`,
        ];
    }

    static query(
        trx: TransactionOrKnex,
        {revId, branch}: {revId?: string; branch?: RevisionBranch} = {},
    ) {
        const query = Entry.query(trx)
            .select(this._selectedColumns)
            .join(Revision.tableName, this._joinRevision({revId, branch}));

        if (revId) {
            query.where({[RevisionColumn.RevId]: revId});
        }

        return query as unknown as QueryBuilder<JoinedEntryRevision, JoinedEntryRevision[]>;
    }

    [EntryColumn.Scope]!: Entry[typeof EntryColumn.Scope];
    [EntryColumn.Type]!: Entry[typeof EntryColumn.Type];
    [EntryColumn.Key]!: Entry[typeof EntryColumn.Key];
    [EntryColumn.InnerMeta]!: Entry[typeof EntryColumn.InnerMeta];
    [EntryColumn.CreatedBy]!: Entry[typeof EntryColumn.CreatedBy];
    [EntryColumn.CreatedAt]!: Entry[typeof EntryColumn.CreatedAt];
    [EntryColumn.IsDeleted]!: Entry[typeof EntryColumn.IsDeleted];
    [EntryColumn.DeletedAt]!: Entry[typeof EntryColumn.DeletedAt];
    [EntryColumn.Hidden]!: Entry[typeof EntryColumn.Hidden];
    [EntryColumn.DisplayKey]!: Entry[typeof EntryColumn.DisplayKey];
    [EntryColumn.EntryId]!: Entry[typeof EntryColumn.EntryId];
    [EntryColumn.SavedId]!: Entry[typeof EntryColumn.SavedId];
    [EntryColumn.PublishedId]!: Entry[typeof EntryColumn.PublishedId];
    [EntryColumn.TenantId]!: Entry[typeof EntryColumn.TenantId];
    [EntryColumn.Name]!: Entry[typeof EntryColumn.Name];
    [EntryColumn.SortName]!: Entry[typeof EntryColumn.SortName];
    [EntryColumn.Public]!: Entry[typeof EntryColumn.Public];
    [EntryColumn.UnversionedData]!: Entry[typeof EntryColumn.UnversionedData];
    [EntryColumn.WorkbookId]!: Entry[typeof EntryColumn.WorkbookId];
    [EntryColumn.Mirrored]!: Entry[typeof EntryColumn.Mirrored];

    [RevisionColumn.Data]!: Nullable<Revision[typeof RevisionColumn.Data]>;
    [RevisionColumn.Meta]!: Nullable<Revision[typeof RevisionColumn.Meta]>;
    [RevisionColumn.UpdatedBy]!: Nullable<Revision[typeof RevisionColumn.UpdatedBy]>;
    [RevisionColumn.UpdatedAt]!: Nullable<Revision[typeof RevisionColumn.UpdatedAt]>;
    [RevisionColumn.RevId]!: Nullable<Revision[typeof RevisionColumn.RevId]>;
    [RevisionColumn.Links]!: Nullable<Revision[typeof RevisionColumn.Links]>;
}
