import type {Knex} from 'knex';
import {Modifier, TransactionOrKnex, raw} from 'objection';

import {Model} from '../..';
import {Entry} from '../../models/new/entry';
import {Favorite} from '../../models/new/favorite';
import {selectedEntryColumns} from '../constants';
import {leftJoinFavorite} from '../utils';

const selectedColumns = [
    ...selectedEntryColumns.map((col) => `${Entry.tableName}.${col}`),
    raw(`CASE WHEN ${Favorite.tableName}.entry_id IS NULL THEN FALSE ELSE TRUE END AS is_favorite`),
];

export type JoinedEntryFavoriteColumns = Pick<Entry, ArrayElement<typeof selectedEntryColumns>> & {
    isFavorite: boolean;
};

export class JoinedEntryFavorite extends Model {
    static get tableName() {
        return Entry.tableName;
    }

    static get idColumn() {
        return Entry.idColumn;
    }

    static find({
        where,
        userLogin,
        trx,
    }: {
        where: Record<string, unknown> | ((builder: Knex.QueryBuilder) => void);
        userLogin: string;
        trx: TransactionOrKnex;
    }) {
        return JoinedEntryFavorite.query(trx)
            .select(selectedColumns)
            .leftJoin(Favorite.tableName, leftJoinFavorite(userLogin))
            .where(where)
            .timeout(JoinedEntryFavorite.DEFAULT_QUERY_TIMEOUT) as unknown as Promise<
            JoinedEntryFavoriteColumns[]
        >;
    }

    static findOne({
        where,
        userLogin,
        trx,
    }: {
        where: Record<string, unknown> | ((builder: Knex.QueryBuilder) => void);
        userLogin: string;
        trx: TransactionOrKnex;
    }) {
        return JoinedEntryFavorite.query(trx)
            .select(selectedColumns)
            .leftJoin(Favorite.tableName, leftJoinFavorite(userLogin))
            .where(where)
            .first()
            .timeout(JoinedEntryFavorite.DEFAULT_QUERY_TIMEOUT) as unknown as Promise<
            JoinedEntryFavoriteColumns | undefined
        >;
    }

    static findPage({
        where,
        userLogin,
        modify,
        page,
        pageSize,
        trx,
    }: {
        where: Record<string, unknown> | ((builder: Knex.QueryBuilder) => void);
        trx: TransactionOrKnex;
        modify: Modifier;
        userLogin: string;
        page: number;
        pageSize: number;
    }) {
        return JoinedEntryFavorite.query(trx)
            .select(selectedColumns)
            .leftJoin(Favorite.tableName, leftJoinFavorite(userLogin))
            .where(where)
            .modify(modify)
            .limit(pageSize)
            .offset(pageSize * page)
            .timeout(JoinedEntryFavorite.DEFAULT_QUERY_TIMEOUT) as unknown as Promise<Entry[]>;
    }
}
