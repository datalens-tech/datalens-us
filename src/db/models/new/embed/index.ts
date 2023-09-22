import {Model} from '../../..';

export const EmbedModelColumn = {
    EmbedId: 'embedId',
    Title: 'title',
    EmbeddingSecretId: 'embeddingSecretId',
    EntryId: 'entryId',
    DepsIds: 'depsIds',
    UnsignedParams: 'unsignedParams',
    CreatedBy: 'createdBy',
    CreatedAt: 'createdAt',
} as const;

export class EmbedModel extends Model {
    static get tableName() {
        return 'embeds';
    }

    static get idColumn() {
        return EmbedModelColumn.EmbedId;
    }

    [EmbedModelColumn.EmbedId]!: string;
    [EmbedModelColumn.Title]!: string;
    [EmbedModelColumn.EmbeddingSecretId]!: string;
    [EmbedModelColumn.EntryId]!: string;
    [EmbedModelColumn.DepsIds]!: string[];
    [EmbedModelColumn.UnsignedParams]!: string[];
    [EmbedModelColumn.CreatedBy]!: string;
    [EmbedModelColumn.CreatedAt]!: string;
}
