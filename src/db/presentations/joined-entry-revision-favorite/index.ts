import type {Knex} from 'knex';
import {TransactionOrKnex, raw} from 'objection';
import {
    selectedColumns as joinedEntryRevisionColumns,
    joinRevision,
    JoinedEntryRevision,
    JoinedEntryRevisionColumns,
    JoinRevisionArgs,
} from '../joined-entry-revision';

import {RevisionModel} from '../../models/new/revision';
import {Favorite} from '../../models/new/favorite';

import {leftJoinFavorite} from '../utils';

const selectedColumns = [
    ...joinedEntryRevisionColumns,
    raw(`CASE WHEN ${Favorite.tableName}.entry_id IS NULL THEN FALSE ELSE TRUE END AS is_favorite`),
];

export type JoinedEntryRevisionFavoriteColumns = JoinedEntryRevisionColumns & {
    isFavorite: boolean;
};

export class JoinedEntryRevisionFavorite extends JoinedEntryRevision {
    static find({
        where,
        joinRevisionArgs,
        userLogin,
        trx,
    }: {
        where: Record<string, unknown> | ((builder: Knex.QueryBuilder) => void);
        joinRevisionArgs: JoinRevisionArgs;
        userLogin: string;
        trx: TransactionOrKnex;
    }) {
        return JoinedEntryRevisionFavorite.query(trx)
            .select(selectedColumns)
            .join(RevisionModel.tableName, joinRevision(joinRevisionArgs))
            .leftJoin(Favorite.tableName, leftJoinFavorite(userLogin))
            .where(where)
            .timeout(JoinedEntryRevisionFavorite.DEFAULT_QUERY_TIMEOUT) as unknown as Promise<
            JoinedEntryRevisionFavoriteColumns[]
        >;
    }

    static findOne({
        where,
        joinRevisionArgs,
        userLogin,
        trx,
    }: {
        where: Record<string, unknown> | ((builder: Knex.QueryBuilder) => void);
        joinRevisionArgs: JoinRevisionArgs;
        userLogin: string;
        trx: TransactionOrKnex;
    }) {
        return JoinedEntryRevisionFavorite.query(trx)
            .select(selectedColumns)
            .join(RevisionModel.tableName, joinRevision(joinRevisionArgs))
            .leftJoin(Favorite.tableName, leftJoinFavorite(userLogin))
            .where(where)
            .first()
            .timeout(JoinedEntryRevisionFavorite.DEFAULT_QUERY_TIMEOUT) as unknown as Promise<
            JoinedEntryRevisionFavoriteColumns | undefined
        >;
    }
}
