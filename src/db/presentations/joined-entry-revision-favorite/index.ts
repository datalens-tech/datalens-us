import type {Knex} from 'knex';
import {TransactionOrKnex, raw, Modifier, Page} from 'objection';
import {
    selectedColumns as joinedEntryRevisionColumns,
    joinRevision,
    JoinedEntryRevision,
    JoinedEntryRevisionColumns,
    JoinRevisionArgs,
} from '../joined-entry-revision';
import {Entry} from '../../models/new/entry';
import {RevisionModel} from '../../models/new/revision';
import {Favorite} from '../../models/new/favorite';

const selectedColumns = [
    ...joinedEntryRevisionColumns,
    raw(`CASE WHEN ${Favorite.tableName}.entry_id IS NULL THEN FALSE ELSE TRUE END AS is_favorite`),
];

export const leftJoinFavorite = (userLogin: string) => (builder: Knex.JoinClause) => {
    builder
        .on(`${Favorite.tableName}.entryId`, `${Entry.tableName}.entryId`)
        .andOnIn(`${Favorite.tableName}.login`, [userLogin]);
};

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

    static findWithPagination({
        where,
        modify,
        joinRevisionArgs,
        userLogin,
        page,
        pageSize,
        trx,
    }: {
        where: Record<string, unknown> | ((builder: Knex.QueryBuilder) => void);
        modify: Modifier;
        joinRevisionArgs: JoinRevisionArgs;
        userLogin: string;
        page: number;
        pageSize: number;
        trx: TransactionOrKnex;
    }) {
        return JoinedEntryRevisionFavorite.query(trx)
            .select(selectedColumns)
            .join(RevisionModel.tableName, joinRevision(joinRevisionArgs))
            .leftJoin(Favorite.tableName, leftJoinFavorite(userLogin))
            .where(where)
            .modify(modify)
            .page(page, pageSize)
            .timeout(JoinedEntryRevisionFavorite.DEFAULT_QUERY_TIMEOUT) as unknown as Promise<
            Page<Entry>
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
