import {Entry, EntryColumn} from '../../../../db/models/new/entry';
import {Favorite, FavoriteColumn} from '../../../../db/models/new/favorite';
import {RevisionModel, RevisionModelColumn} from '../../../../db/models/new/revision';
import {Tenant, TenantColumn} from '../../../../db/models/new/tenant';

export const entryColumns = [
    EntryColumn.Scope,
    EntryColumn.Type,
    EntryColumn.Key,
    EntryColumn.InnerMeta,
    EntryColumn.CreatedBy,
    EntryColumn.CreatedAt,
    EntryColumn.IsDeleted,
    EntryColumn.DeletedAt,
    EntryColumn.Hidden,
    EntryColumn.DisplayKey,
    EntryColumn.EntryId,
    EntryColumn.SavedId,
    EntryColumn.PublishedId,
    EntryColumn.TenantId,
    EntryColumn.Name,
    EntryColumn.SortName,
    EntryColumn.Public,
    EntryColumn.UnversionedData,
    EntryColumn.WorkbookId,
    EntryColumn.Mirrored,
];

export const selectedEntryColumns = entryColumns.map((column) => `${Entry.tableName}.${column}`);

export const revisionColumns = [
    RevisionModelColumn.Data,
    RevisionModelColumn.Meta,
    RevisionModelColumn.UpdatedBy,
    RevisionModelColumn.UpdatedAt,
    RevisionModelColumn.RevId,
    RevisionModelColumn.Links,
    RevisionModelColumn.EntryId,
] as const;

export const selectedRevisionColumns = revisionColumns.map(
    (column) => `${RevisionModel.tableName}.${column}`,
);

export const tenantColumns = [
    TenantColumn.BillingStartedAt,
    TenantColumn.BillingEndedAt,
    TenantColumn.Features,
    TenantColumn.Settings,
] as const;

export const selectedTenantColumns = tenantColumns.map((column) => `${Tenant.tableName}.${column}`);

export const favoriteColumns = [FavoriteColumn.EntryId, FavoriteColumn.Login] as const;

export const selectedFavoriteColumns = favoriteColumns.map(
    (column) => `${Favorite.tableName}.${column}`,
);
