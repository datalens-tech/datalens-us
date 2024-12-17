import type {AppContext} from '@gravity-ui/nodekit';

import type {CreateCollectionReqBody} from '../../../../controllers/collections/create';
import type {CollectionModel} from '../../../../db/models/new/collection';

export type OnCreateCollectionSuccess = (args: {
    ctx: AppContext;
    reqBody: CreateCollectionReqBody;
    collection: CollectionModel;
}) => void;

export type OnCreateCollectionError = (args: {
    ctx: AppContext;
    reqBody: CreateCollectionReqBody;
    error: unknown;
}) => void;
