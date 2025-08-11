import type {Knex} from 'knex';
import {QueryBuilder, TransactionOrKnex, raw} from 'objection';

import {Entry, EntryColumn} from '../';
import {Favorite, FavoriteColumn} from '../../favorite';
import {RevisionModel as Revision, RevisionModelColumn as RevisionColumn} from '../../revision';

import {JoinedEntryRevision, RevisionBranch} from './joined-entry-revision';

export class JoinedEntryRevisionFavorite extends JoinedEntryRevision {
    static _joinFavorite({userLogin}: {userLogin: string}) {
        return (builder: Knex.JoinClause) => {
            builder
                .on(
                    `${Favorite.tableName}.${FavoriteColumn.EntryId}`,
                    `${Entry.tableName}.${EntryColumn.EntryId}`,
                )
                .andOnIn(`${Favorite.tableName}.${FavoriteColumn.Login}`, [userLogin]);
        };
    }

    static get _selectedColumns() {
        return [
            ...super._selectedColumns,
            raw(
                `CASE WHEN ${Favorite.tableName}.entry_id IS NULL THEN FALSE ELSE TRUE END AS is_favorite`,
            ) as unknown as string,
        ];
    }

    static query(
        trx: TransactionOrKnex,
        {userLogin, revId, branch}: {userLogin: string; revId?: string; branch?: RevisionBranch},
    ) {
        const query = Entry.query(trx)
            .select(this._selectedColumns)
            .join(Revision.tableName, this._joinRevision({revId, branch}))
            .join(Favorite.tableName, this._joinFavorite({userLogin}));

        if (revId) {
            query.where({[RevisionColumn.RevId]: revId});
        }

        return query as unknown as QueryBuilder<
            JoinedEntryRevisionFavorite,
            JoinedEntryRevisionFavorite[]
        >;
    }

    isFavorite!: boolean;
}
