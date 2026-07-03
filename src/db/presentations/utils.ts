import type {Knex} from 'knex';

import {Entry, EntryColumn} from '../models/new/entry';
import {Favorite, FavoriteColumn, FavoriteEntityType} from '../models/new/favorite';

export const leftJoinFavorite = (userLogin: string) => (builder: Knex.JoinClause) => {
    builder
        .on(
            `${Favorite.tableName}.${FavoriteColumn.EntityId}`,
            `${Entry.tableName}.${EntryColumn.EntryId}`,
        )
        .andOnVal(
            `${Favorite.tableName}.${FavoriteColumn.EntityType}`,
            '=',
            FavoriteEntityType.Entry,
        )
        .andOnIn(`${Favorite.tableName}.${FavoriteColumn.Login}`, [userLogin]);
};
