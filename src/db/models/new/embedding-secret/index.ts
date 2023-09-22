import {Model} from '../../..';

export const EmbeddingSecretModelColumn = {
    EmbeddingSecretId: 'embeddingSecretId',
    Title: 'title',
    WorkbookId: 'workbookId',
    PublicKey: 'publicKey',
    CreatedBy: 'createdBy',
    CreatedAt: 'createdAt',
} as const;

export class EmbeddingSecretModel extends Model {
    static get tableName() {
        return 'embedding_secrets';
    }

    static get idColumn() {
        return EmbeddingSecretModelColumn.EmbeddingSecretId;
    }

    [EmbeddingSecretModelColumn.EmbeddingSecretId]!: string;
    [EmbeddingSecretModelColumn.Title]!: string;
    [EmbeddingSecretModelColumn.WorkbookId]!: string;
    [EmbeddingSecretModelColumn.PublicKey]!: string;
    [EmbeddingSecretModelColumn.CreatedBy]!: string;
    [EmbeddingSecretModelColumn.CreatedAt]!: string;
}
