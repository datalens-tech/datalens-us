import type {AppContext} from '@gravity-ui/nodekit';

export type CheckEmbedding = (args: {ctx: AppContext}) => boolean;

export type GetEmbeddingWorkbookId = (args: {ctx: AppContext}) => string | null;
