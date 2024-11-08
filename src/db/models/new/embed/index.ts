import {Model} from '../../..';

export const EmbedModelColumn = {
    EmbedId: 'embedId',
    Title: 'title',
    EmbeddingSecretId: 'embeddingSecretId',
    EntryId: 'entryId',
    DepsIds: 'depsIds',
    UnsignedParams: 'unsignedParams',
    PrivateParams: 'privateParams',
    PublicParamsMode: 'publicParamsMode',
    CreatedBy: 'createdBy',
    CreatedAt: 'createdAt',
    UpdatedBy: 'updatedBy',
    UpdatedAt: 'updatedAt',
    Settings: 'settings',
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
    [EmbedModelColumn.PrivateParams]!: string[];
    [EmbedModelColumn.PublicParamsMode]!: boolean;
    [EmbedModelColumn.CreatedBy]!: string;
    [EmbedModelColumn.CreatedAt]!: string;
    [EmbedModelColumn.UpdatedBy]!: string;
    [EmbedModelColumn.UpdatedAt]!: string;
    [EmbedModelColumn.Settings]!: Record<string, unknown>;
}
