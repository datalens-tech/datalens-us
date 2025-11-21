import {Model} from '../../..';
import {mapValuesToSnakeCase} from '../../../../utils';

export const RevisionModelColumn = {
    Data: 'data',
    Meta: 'meta',
    Annotation: 'annotation',
    CreatedBy: 'createdBy',
    CreatedAt: 'createdAt',
    UpdatedBy: 'updatedBy',
    UpdatedAt: 'updatedAt',
    RevId: 'revId',
    EntryId: 'entryId',
    Links: 'links',
    Version: 'version',
    SourceVersion: 'sourceVersion',
} as const;

export const RevisionModelColumnRaw = mapValuesToSnakeCase(RevisionModelColumn);

export enum RevisionAnnotationFields {
    Description = 'description',
}

export class RevisionModel extends Model {
    static get tableName() {
        return 'revisions';
    }

    static get idColumn() {
        return RevisionModelColumn.RevId;
    }

    [RevisionModelColumn.Data]!: Nullable<Record<string, unknown>>;
    [RevisionModelColumn.Meta]!: Nullable<Record<string, unknown>>;
    [RevisionModelColumn.Annotation]!: Nullable<{description?: string}>;
    [RevisionModelColumn.CreatedBy]!: string;
    [RevisionModelColumn.CreatedAt]!: string;
    [RevisionModelColumn.UpdatedBy]!: string;
    [RevisionModelColumn.UpdatedAt]!: string;
    [RevisionModelColumn.RevId]!: string;
    [RevisionModelColumn.EntryId]!: string;
    [RevisionModelColumn.Links]!: Nullable<Record<string, unknown>>;
    [RevisionModelColumn.Version]!: Nullable<number>;
    [RevisionModelColumn.SourceVersion]!: Nullable<number>;
}
