import type {AppContext} from '@gravity-ui/nodekit';

import type {CreateCollectionReqBody} from '../../../../controllers/collections/create-collection';
import type {DeleteCollectionReqParams} from '../../../../controllers/collections/delete-collection';
import type {DeleteCollectionsListReqBody} from '../../../../controllers/collections/delete-collections-list';
import type {
    MoveCollectionReqBody,
    MoveCollectionReqParams,
} from '../../../../controllers/collections/move-collection';
import type {MoveCollectionsListReqBody} from '../../../../controllers/collections/move-collections-list';
import type {
    UpdateCollectionReqBody,
    UpdateCollectionReqParams,
} from '../../../../controllers/collections/update-collection';
import type {CollectionModel} from '../../../../db/models/new/collection';

export enum LogEventType {
    CreateCollectionSuccess = 'createCollectionSuccess',
    CreateCollectionFail = 'createCollectionFail',

    UpdateCollectionSuccess = 'updateCollectionSuccess',
    UpdateCollectionFail = 'updateCollectionFail',

    MoveCollectionSuccess = 'moveCollectionSuccess',
    MoveCollectionFail = 'moveCollectionFail',

    MoveCollectionsListSuccess = 'moveCollectionsListSuccess',
    MoveCollectionsListFail = 'moveCollectionsListFail',

    DeleteCollectionSuccess = 'deleteCollectionSuccess',
    DeleteCollectionFail = 'deleteCollectionFail',

    DeleteCollectionsListSuccess = 'deleteCollectionsListSuccess',
    DeleteCollectionsListFail = 'deleteCollectionsListFail',
}

interface EventParams {
    type: LogEventType;
    ctx: AppContext;
}

export interface LogEventCreateCollectionSuccessParams extends EventParams {
    type: LogEventType.CreateCollectionSuccess;

    reqBody: CreateCollectionReqBody;
    collection: CollectionModel;
}

export interface LogEventCreateCollectionFailParams extends EventParams {
    type: LogEventType.CreateCollectionFail;

    reqBody: CreateCollectionReqBody;
    error: unknown;
}

export interface LogEventUpdateCollectionSuccessParams extends EventParams {
    type: LogEventType.UpdateCollectionSuccess;

    reqBody: UpdateCollectionReqBody;
    reqParams: UpdateCollectionReqParams;
    collection: CollectionModel;
}

export interface LogEventUpdateCollectionFailParams extends EventParams {
    type: LogEventType.UpdateCollectionFail;

    reqBody: UpdateCollectionReqBody;
    reqParams: UpdateCollectionReqParams;
    error: unknown;
}

export interface LogEventMoveCollectionSuccessParams extends EventParams {
    type: LogEventType.MoveCollectionSuccess;

    reqBody: MoveCollectionReqBody;
    reqParams: MoveCollectionReqParams;
    collection: CollectionModel;
}

export interface LogEventMoveCollectionFailParams extends EventParams {
    type: LogEventType.MoveCollectionFail;

    reqBody: MoveCollectionReqBody;
    reqParams: MoveCollectionReqParams;
    error: unknown;
}

export interface LogEventMoveCollectionsListSuccessParams extends EventParams {
    type: LogEventType.MoveCollectionsListSuccess;

    reqBody: MoveCollectionsListReqBody;
    collections: CollectionModel[];
}

export interface LogEventMoveCollectionsListFailParams extends EventParams {
    type: LogEventType.MoveCollectionsListFail;

    reqBody: MoveCollectionsListReqBody;
    error: unknown;
}

export interface LogEventDeleteCollectionSuccessParams extends EventParams {
    type: LogEventType.DeleteCollectionSuccess;

    reqParams: DeleteCollectionReqParams;
    collections: CollectionModel[];
}

export interface LogEventDeleteCollectionFailParams extends EventParams {
    type: LogEventType.DeleteCollectionFail;

    reqParams: DeleteCollectionReqParams;
    error: unknown;
}

export interface LogEventDeleteCollectionsListSuccessParams extends EventParams {
    type: LogEventType.DeleteCollectionsListSuccess;

    reqBody: DeleteCollectionsListReqBody;
    collections: CollectionModel[];
}

export interface LogEventDeleteCollectionsListFailParams extends EventParams {
    type: LogEventType.DeleteCollectionsListFail;

    reqBody: DeleteCollectionsListReqBody;
    error: unknown;
}

export type LogEventParams =
    | LogEventCreateCollectionSuccessParams
    | LogEventCreateCollectionFailParams
    | LogEventUpdateCollectionSuccessParams
    | LogEventUpdateCollectionFailParams
    | LogEventMoveCollectionSuccessParams
    | LogEventMoveCollectionFailParams
    | LogEventMoveCollectionsListSuccessParams
    | LogEventMoveCollectionsListFailParams
    | LogEventDeleteCollectionSuccessParams
    | LogEventDeleteCollectionFailParams
    | LogEventDeleteCollectionsListSuccessParams
    | LogEventDeleteCollectionsListFailParams;

export type LogEvent = (params: LogEventParams) => void;
