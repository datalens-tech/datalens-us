import type {CheckEmbedding, CheckEmbeddingAvailability} from './types';

export const checkEmbedding: CheckEmbedding = () => false;

export const checkEmbeddingAvailability: CheckEmbeddingAvailability = () => Promise.resolve();
