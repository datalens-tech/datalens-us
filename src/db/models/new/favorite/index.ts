import {Model} from '../../..';

import {FavoriteEntityType} from './types';

export {FavoriteEntityType} from './types';

export const FavoriteColumn = {
    EntryId: 'entryId',
    EntityId: 'entityId',
    EntityType: 'entityType',
    TenantId: 'tenantId',
    Login: 'login',
    Alias: 'alias',
    DisplayAlias: 'displayAlias',
    SortAlias: 'sortAlias',
    CreatedAt: 'createdAt',
} as const;

export const FavoriteColumnRaw = {
    EntryId: 'entry_id',
    EntityId: 'entity_id',
    EntityType: 'entity_type',
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
        return [FavoriteColumn.EntityId, FavoriteColumn.Login];
    }

    [FavoriteColumn.EntryId]!: string;
    [FavoriteColumn.EntityId]!: string;
    [FavoriteColumn.EntityType]!: FavoriteEntityType;
    [FavoriteColumn.TenantId]!: string;
    [FavoriteColumn.Login]!: string;
    [FavoriteColumn.CreatedAt]!: string;
    [FavoriteColumn.Alias]!: Nullable<string>;
    [FavoriteColumn.DisplayAlias]!: Nullable<string>;
    [FavoriteColumn.SortAlias]!: Nullable<string>;
}
