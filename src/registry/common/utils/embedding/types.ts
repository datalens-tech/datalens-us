import type {AppContext} from '@gravity-ui/nodekit';

export type CheckEmbedding = (args: {ctx: AppContext}) => boolean;

export type CheckEmbeddingAvailability = (tenantId: string) => Promise<void>;
