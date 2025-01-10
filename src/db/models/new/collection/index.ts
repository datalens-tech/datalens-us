import {Model} from '../../..';

export const CollectionModelColumn = {
    CollectionId: 'collectionId',
    Title: 'title',
    TitleLower: 'titleLower',
    Description: 'description',
    ParentId: 'parentId',
    TenantId: 'tenantId',
    CreatedBy: 'createdBy',
    CreatedAt: 'createdAt',
    UpdatedBy: 'updatedBy',
    UpdatedAt: 'updatedAt',
    DeletedBy: 'deletedBy',
    DeletedAt: 'deletedAt',
    Meta: 'meta',
    SortTitle: 'sortTitle',
} as const;

export class CollectionModel extends Model {
    static get tableName() {
        return 'collections';
    }

    static get idColumn() {
        return CollectionModelColumn.CollectionId;
    }

    [CollectionModelColumn.CollectionId]!: string;
    [CollectionModelColumn.Title]!: string;
    [CollectionModelColumn.TitleLower]!: string;
    [CollectionModelColumn.Description]!: Nullable<string>;
    [CollectionModelColumn.ParentId]!: Nullable<string>;
    [CollectionModelColumn.TenantId]!: string;
    [CollectionModelColumn.CreatedBy]!: string;
    [CollectionModelColumn.CreatedAt]!: string;
    [CollectionModelColumn.UpdatedBy]!: string;
    [CollectionModelColumn.UpdatedAt]!: string;
    [CollectionModelColumn.DeletedBy]!: Nullable<string>;
    [CollectionModelColumn.DeletedAt]!: Nullable<string>;
    [CollectionModelColumn.Meta]!: Record<string, unknown>;
    [CollectionModelColumn.SortTitle]!: string;
}
