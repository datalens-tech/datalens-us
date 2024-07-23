import type {Knex} from 'knex';
import {TransactionOrKnex, raw} from 'objection';
import {Model} from '../..';
import {Entry} from '../../models/new/entry';
import {RevisionModel} from '../../models/new/revision';

import {selectedEntryColumns} from '../constants';
import {EntriesOrderByFilter} from '../../../types/models';

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
}

export const joinRevision =
    ({revId, branch}: JoinRevisionArgs) =>
    (builder: Knex.JoinClause) => {
        if (revId) {
            builder.on(`${Entry.tableName}.entryId`, `${RevisionModel.tableName}.entryId`);
        } else if (branch === 'published') {
            builder.on(`${Entry.tableName}.publishedId`, `${RevisionModel.tableName}.revId`);
        } else if (branch === 'saved') {
            builder.on(`${Entry.tableName}.savedId`, `${RevisionModel.tableName}.revId`);
        } else {
            builder.on(
                raw(
                    `COALESCE(${Entry.tableName}.published_id, ${Entry.tableName}.saved_id)`,
                ) as unknown as string,
                `${RevisionModel.tableName}.revId`,
            );
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
        joinRevisionArgs = {},
        trx,
        limit,
        orderBy,
    }: {
        where: Record<string, unknown> | ((builder: Knex.QueryBuilder) => void);
        joinRevisionArgs?: JoinRevisionArgs;
        trx: TransactionOrKnex;
        limit?: number;
        orderBy?: EntriesOrderByFilter;
    }) {
        const joinedEntryRevision = JoinedEntryRevision.query(trx)
            .select(selectedColumns)
            .join(RevisionModel.tableName, joinRevision(joinRevisionArgs))
            .where(where);

        if (orderBy) {
            joinedEntryRevision.orderBy(orderBy.field, orderBy.direction);
        }

        if (limit) {
            joinedEntryRevision.limit(limit);
        }

        return joinedEntryRevision.timeout(
            JoinedEntryRevision.DEFAULT_QUERY_TIMEOUT,
        ) as unknown as Promise<JoinedEntryRevisionColumns[]>;
    }

    static findOne({
        where,
        joinRevisionArgs = {},
        trx,
    }: {
        where: Record<string, unknown> | ((builder: Knex.QueryBuilder) => void);
        joinRevisionArgs?: JoinRevisionArgs;
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
