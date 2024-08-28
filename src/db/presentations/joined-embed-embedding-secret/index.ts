import type {Knex} from 'knex';
import {TransactionOrKnex} from 'objection';
import {EmbedModel, EmbedModelColumn} from '../../models/new/embed';
import {EmbeddingSecretModel, EmbeddingSecretModelColumn} from '../../models/new/embedding-secret';

const selectedEmbedColumns = [
    EmbedModelColumn.EmbedId,
    EmbedModelColumn.Title,
    EmbedModelColumn.EmbeddingSecretId,
    EmbedModelColumn.EntryId,
    EmbedModelColumn.DepsIds,
    EmbedModelColumn.UnsignedParams,
    EmbedModelColumn.PrivateParams,
    EmbedModelColumn.PublicParamsMode,
    EmbedModelColumn.CreatedBy,
    EmbedModelColumn.CreatedAt,
    EmbedModelColumn.UpdatedBy,
    EmbedModelColumn.UpdatedAt,
] as const;

const selectedEmbeddingSecretsColumns = [EmbeddingSecretModelColumn.PublicKey] as const;

const selectedEmbedEmbeddingSecretColumns = [
    ...selectedEmbedColumns.map((col) => `${EmbedModel.tableName}.${col}`),
    ...selectedEmbeddingSecretsColumns.map((col) => `${EmbeddingSecretModel.tableName}.${col}`),
];

export type JoinedEmbedEmbeddingSecretColumns = Pick<
    EmbedModel,
    ArrayElement<typeof selectedEmbedColumns>
> &
    Pick<EmbeddingSecretModel, ArrayElement<typeof selectedEmbeddingSecretsColumns>>;

export class JoinedEmbedEmbeddingSecret extends EmbedModel {
    static find({
        trx,
        where,
    }: {
        trx: TransactionOrKnex;
        where: Record<string, unknown> | ((builder: Knex.QueryBuilder) => void);
    }) {
        return EmbedModel.query(trx)
            .select(selectedEmbedEmbeddingSecretColumns)
            .join(EmbeddingSecretModel.tableName, (builder: Knex.JoinClause) => {
                builder.on(
                    `${EmbedModel.tableName}.${EmbedModelColumn.EmbeddingSecretId}`,
                    `${EmbeddingSecretModel.tableName}.${EmbeddingSecretModelColumn.EmbeddingSecretId}`,
                );
            })
            .where(where)
            .timeout(EmbedModel.DEFAULT_QUERY_TIMEOUT) as unknown as Promise<
            JoinedEmbedEmbeddingSecretColumns[]
        >;
    }

    static findOne({
        trx,
        where,
    }: {
        trx: TransactionOrKnex;
        where: Record<string, unknown> | ((builder: Knex.QueryBuilder) => void);
    }) {
        return EmbedModel.query(trx)
            .select(selectedEmbedEmbeddingSecretColumns)
            .join(EmbeddingSecretModel.tableName, (builder: Knex.JoinClause) => {
                builder.on(
                    `${EmbedModel.tableName}.${EmbedModelColumn.EmbeddingSecretId}`,
                    `${EmbeddingSecretModel.tableName}.${EmbeddingSecretModelColumn.EmbeddingSecretId}`,
                );
            })
            .where(where)
            .first()
            .timeout(EmbedModel.DEFAULT_QUERY_TIMEOUT) as unknown as Promise<
            JoinedEmbedEmbeddingSecretColumns | undefined
        >;
    }
}
