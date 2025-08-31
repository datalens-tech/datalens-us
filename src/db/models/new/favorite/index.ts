import {Model} from '../../..';

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
        return [FavoriteColumn.EntryId, FavoriteColumn.Login];
    }

    [FavoriteColumn.EntryId]!: string;
    [FavoriteColumn.TenantId]!: string;
    [FavoriteColumn.Login]!: string;
    [FavoriteColumn.CreatedAt]!: string;
    [FavoriteColumn.Alias]!: Nullable<string>;
    [FavoriteColumn.DisplayAlias]!: Nullable<string>;
    [FavoriteColumn.SortAlias]!: Nullable<string>;
}
