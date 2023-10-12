import type {Knex} from 'knex';
import {TransactionOrKnex} from 'objection';
import {Model} from '../..';
import {Entry} from '../../models/new/entry';
import {RevisionModel} from '../../models/new/revision';

const selectedEntryColumns = [
    'scope',
    'type',
    'key',
    'innerMeta',
    'createdBy',
    'createdAt',
    'isDeleted',
    'deletedAt',
    'hidden',
    'displayKey',
    'entryId',
    'savedId',
    'publishedId',
    'tenantId',
    'name',
    'sortName',
    'public',
    'unversionedData',
    'workbookId',
] as const;

const selectedRevisionColumns = [
    'data',
    'meta',
    'updatedBy',
    'updatedAt',
    'revId',
    'links',
] as const;

export const selectedColumns = [
    ...selectedEntryColumns.map((col) => `${Entry.tableName}.${col}`),
    ...selectedRevisionColumns.map((col) => `${RevisionModel.tableName}.${col}`),
];

export interface JoinRevisionArgs {
    revId?: RevisionModel['revId'];
    branch?: 'saved' | 'published';
    isPublishFallback?: boolean;
}

export const joinRevision =
    ({revId, branch, isPublishFallback}: JoinRevisionArgs) =>
    (builder: Knex.JoinClause) => {
        if (revId) {
            builder.on(`${Entry.tableName}.entryId`, `${RevisionModel.tableName}.entryId`);
        } else if (branch === 'published') {
            builder.on(`${Entry.tableName}.publishedId`, `${RevisionModel.tableName}.revId`);
        } else {
            builder.on(`${Entry.tableName}.savedId`, `${RevisionModel.tableName}.revId`);
            if (isPublishFallback) {
                builder.orOn(`${Entry.tableName}.publishedId`, `${RevisionModel.tableName}.revId`);
            }
        }
    };

export type JoinedEntryRevisionColumns = Pick<Entry, ArrayElement<typeof selectedEntryColumns>> &
    Pick<RevisionModel, ArrayElement<typeof selectedRevisionColumns>>;

export class JoinedEntryRevision extends Model {
    static get tableName() {
        return Entry.tableName;
    }

    static get idColumn() {
        return Entry.idColumn;
    }

    static find({
        where,
        joinRevisionArgs,
        trx,
    }: {
        where: Record<string, unknown> | ((builder: Knex.QueryBuilder) => void);
        joinRevisionArgs: JoinRevisionArgs;
        trx: TransactionOrKnex;
    }) {
        return JoinedEntryRevision.query(trx)
            .select(selectedColumns)
            .join(RevisionModel.tableName, joinRevision(joinRevisionArgs))
            .where(where)
            .timeout(JoinedEntryRevision.DEFAULT_QUERY_TIMEOUT) as unknown as Promise<
            JoinedEntryRevisionColumns[]
        >;
    }

    static findOne({
        where,
        joinRevisionArgs,
        trx,
    }: {
        where: Record<string, unknown> | ((builder: Knex.QueryBuilder) => void);
        joinRevisionArgs: JoinRevisionArgs;
        trx: TransactionOrKnex;
    }) {
        return JoinedEntryRevision.query(trx)
            .select(selectedColumns)
            .join(RevisionModel.tableName, joinRevision(joinRevisionArgs))
            .where(where)
            .first()
            .timeout(JoinedEntryRevision.DEFAULT_QUERY_TIMEOUT) as unknown as Promise<
            JoinedEntryRevisionColumns | undefined
        >;
    }
}
