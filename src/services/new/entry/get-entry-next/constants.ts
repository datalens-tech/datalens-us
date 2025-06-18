import {Entry, EntryColumn} from '../../../../db/models/new/entry';
import {Favorite, FavoriteColumn} from '../../../../db/models/new/favorite';
import {RevisionModel, RevisionModelColumn} from '../../../../db/models/new/revision';
import {Tenant, TenantColumn} from '../../../../db/models/new/tenant';

export const selectedEntryColumns = [
    `${Entry.tableName}.${EntryColumn.Scope}`,
    `${Entry.tableName}.${EntryColumn.Type}`,
    `${Entry.tableName}.${EntryColumn.Key}`,
    `${Entry.tableName}.${EntryColumn.InnerMeta}`,
    `${Entry.tableName}.${EntryColumn.CreatedBy}`,
    `${Entry.tableName}.${EntryColumn.CreatedAt}`,
    `${Entry.tableName}.${EntryColumn.IsDeleted}`,
    `${Entry.tableName}.${EntryColumn.DeletedAt}`,
    `${Entry.tableName}.${EntryColumn.Hidden}`,
    `${Entry.tableName}.${EntryColumn.DisplayKey}`,
    `${Entry.tableName}.${EntryColumn.EntryId}`,
    `${Entry.tableName}.${EntryColumn.SavedId}`,
    `${Entry.tableName}.${EntryColumn.PublishedId}`,
    `${Entry.tableName}.${EntryColumn.TenantId}`,
    `${Entry.tableName}.${EntryColumn.Name}`,
    `${Entry.tableName}.${EntryColumn.SortName}`,
    `${Entry.tableName}.${EntryColumn.Public}`,
    `${Entry.tableName}.${EntryColumn.UnversionedData}`,
    `${Entry.tableName}.${EntryColumn.WorkbookId}`,
    `${Entry.tableName}.${EntryColumn.Mirrored}`,
] as const;

export const selectedRevisionColumns = [
    `${RevisionModel.tableName}.${RevisionModelColumn.Data}`,
    `${RevisionModel.tableName}.${RevisionModelColumn.Meta}`,
    `${RevisionModel.tableName}.${RevisionModelColumn.UpdatedBy}`,
    `${RevisionModel.tableName}.${RevisionModelColumn.UpdatedAt}`,
    `${RevisionModel.tableName}.${RevisionModelColumn.RevId}`,
    `${RevisionModel.tableName}.${RevisionModelColumn.Links}`,
    `${RevisionModel.tableName}.${RevisionModelColumn.EntryId}`,
] as const;

export const selectedTenantColumns = [
    `${Tenant.tableName}.${TenantColumn.BillingStartedAt}`,
    `${Tenant.tableName}.${TenantColumn.BillingEndedAt}`,
    `${Tenant.tableName}.${TenantColumn.Features}`,
] as const;

export const selectedFavoriteColumns = [
    `${Favorite.tableName}.${FavoriteColumn.EntryId}`,
    `${Favorite.tableName}.${FavoriteColumn.Login}`,
] as const;
