import type {Knex} from 'knex';
import {TransactionOrKnex, raw, Modifier, Page} from 'objection';
import {Model} from '../..';
import {Entry} from '../../models/new/entry';
import {Favorite} from '../../models/new/favorite';

import {leftJoinFavorite} from '../utils';

import {selectedEntryColumns} from '../constants';

const selectedColumns = [
    ...selectedEntryColumns.map((col) => `${Entry.tableName}.${col}`),
    'display_key as key',
    raw(`CASE WHEN ${Favorite.tableName}.entry_id IS NULL THEN FALSE ELSE TRUE END AS is_favorite`),
];

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
            .page(page, pageSize)
            .timeout(JoinedEntryFavorite.DEFAULT_QUERY_TIMEOUT) as unknown as Promise<Page<Entry>>;
    }
}
