import {Model} from '../../..';
import {RevisionModel} from '../revision';
import {WorkbookModel} from '../workbook';
import {Favorite} from '../favorite';

export enum EntryScope {
    Connection = 'connection',
    Dataset = 'dataset',
    Widget = 'widget',
    Dash = 'dash',
    Folder = 'folder',
    Config = 'config',
    Pdf = 'pdf',
}

// "type" is a string field and value can be any string, this enum is only used for checks in code
export enum EntryType {
    File = 'file',
    GsheetsV2 = 'gsheets_v2',
    // types can be added as needed
}

export const EntryColumn = {
    Scope: 'scope',
    Type: 'type',
    Key: 'key',
    InnerMeta: 'innerMeta',
    CreatedBy: 'createdBy',
    CreatedAt: 'createdAt',
    UpdatedBy: 'updatedBy',
    UpdatedAt: 'updatedAt',
    IsDeleted: 'isDeleted',
    DeletedAt: 'deletedAt',
    Hidden: 'hidden',
    DisplayKey: 'displayKey',
    EntryId: 'entryId',
    SavedId: 'savedId',
    PublishedId: 'publishedId',
    TenantId: 'tenantId',
    Name: 'name',
    SortName: 'sortName',
    Public: 'public',
    UnversionedData: 'unversionedData',
    WorkbookId: 'workbookId',
} as const;

export class Entry extends Model {
    static get tableName() {
        return 'entries';
    }

    static get idColumn() {
        return EntryColumn.EntryId;
    }

    static get relationMappings() {
        return {
            revisions: {
                relation: Model.HasManyRelation,
                modelClass: RevisionModel,
                join: {
                    from: `${Entry.tableName}.${EntryColumn.EntryId}`,
                    to: `${RevisionModel.tableName}.entryId`,
                },
            },
            savedRevision: {
                relation: Model.HasOneRelation,
                modelClass: RevisionModel,
                join: {
                    from: `${Entry.tableName}.${EntryColumn.SavedId}`,
                    to: `${RevisionModel.tableName}.revId`,
                },
            },
            publishedRevision: {
                relation: Model.HasOneRelation,
                modelClass: RevisionModel,
                join: {
                    from: `${Entry.tableName}.${EntryColumn.PublishedId}`,
                    to: `${RevisionModel.tableName}.revId`,
                },
            },
            workbook: {
                relation: Model.BelongsToOneRelation,
                modelClass: WorkbookModel,
                join: {
                    from: `${Entry.tableName}.${EntryColumn.WorkbookId}`,
                    to: `${WorkbookModel.tableName}.workbookId`,
                },
            },
            favorite: {
                relation: Model.HasOneRelation,
                modelClass: RevisionModel,
                join: {
                    from: `${Entry.tableName}.${EntryColumn.EntryId}`,
                    to: `${Favorite.tableName}.entryId`,
                },
            },
        };
    }

    [EntryColumn.Scope]!: Nullable<EntryScope>;
    [EntryColumn.Type]!: string;
    [EntryColumn.Key]!: Nullable<string>;
    [EntryColumn.InnerMeta]!: Nullable<Record<string, unknown>>;
    [EntryColumn.CreatedBy]!: string;
    [EntryColumn.CreatedAt]!: string;
    [EntryColumn.UpdatedBy]!: string;
    [EntryColumn.UpdatedAt]!: string;
    [EntryColumn.IsDeleted]!: boolean;
    [EntryColumn.DeletedAt]!: Nullable<string>;
    [EntryColumn.Hidden]!: boolean;
    [EntryColumn.DisplayKey]!: Nullable<string>;
    [EntryColumn.EntryId]!: string;
    [EntryColumn.SavedId]!: Nullable<string>;
    [EntryColumn.PublishedId]!: Nullable<string>;
    [EntryColumn.TenantId]!: Nullable<string>;
    [EntryColumn.Name]!: Nullable<string>;
    [EntryColumn.SortName]!: ArrayBuffer;
    [EntryColumn.Public]!: boolean;
    [EntryColumn.UnversionedData]!: Record<string, unknown>;
    [EntryColumn.WorkbookId]!: Nullable<string>;

    revisions?: RevisionModel[];
    savedRevision?: RevisionModel;
    publishedRevision?: RevisionModel;
    workbook?: WorkbookModel;
    favorite?: Favorite;

    get currentRevision() {
        return this.savedRevision ?? this.publishedRevision;
    }

    get isFavorite() {
        return Boolean(this.favorite?.entryId);
    }
}
