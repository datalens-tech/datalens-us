import {Model} from '../../..';
import {Entry} from '../entry';

export const FavoriteColumn = {
    EntryId: 'entryId',
    TenantId: 'tenantId',
    Login: 'login',
    Alias: 'alias',
    DisplayAlias: 'displayAlias',
    SortAlias: 'sortAlias',
    CreatedAt: 'createdAt',
} as const;

export const FavoriteColumnRaw = {
    EntryId: 'entry_id',
    TenantId: 'tenant_id',
    Login: 'login',
    Alias: 'alias',
    DisplayAlias: 'display_alias',
    SortAlias: 'sort_alias',
    CreatedAt: 'created_at',
} as const;

export class Favorite extends Model {
    static get tableName() {
        return 'favorites';
    }

    static get idColumn() {
        return 'entryId';
    }

    static get relationMappings() {
        return {
            entry: {
                relation: Model.BelongsToOneRelation,
                modelClass: Entry,
                join: {
                    from: `${Favorite.tableName}.entryId`,
                    to: `${Entry.tableName}.entryId`,
                },
            },
        };
    }

    [FavoriteColumn.EntryId]!: string;
    [FavoriteColumn.TenantId]!: string;
    [FavoriteColumn.Login]!: string;
    [FavoriteColumn.Alias]!: string | null;
    [FavoriteColumn.DisplayAlias]!: string | null;
    [FavoriteColumn.SortAlias]!: string | null;
    [FavoriteColumn.CreatedAt]!: string;

    entry?: Entry;
}
