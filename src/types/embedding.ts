export type EmbeddingToken = {
    embedId: string;
    dlEmbedService: string;
    iat: number;
    exp: number;
    params: Record<string, unknown>;
};
