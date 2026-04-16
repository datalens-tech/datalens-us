import {EMBEDDING_TYPE} from './constants';

export type EmbeddingType = (typeof EMBEDDING_TYPE)[keyof typeof EMBEDDING_TYPE];
