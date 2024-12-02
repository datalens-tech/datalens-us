import type {Knex} from 'knex';

import {Entry} from '../models/new/entry';
import {Favorite} from '../models/new/favorite';

export const leftJoinFavorite = (userLogin: string) => (builder: Knex.JoinClause) => {
    builder
        .on(`${Favorite.tableName}.entryId`, `${Entry.tableName}.entryId`)
        .andOnIn(`${Favorite.tableName}.login`, [userLogin]);
};
