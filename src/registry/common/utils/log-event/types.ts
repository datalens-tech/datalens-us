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
import type {
    CopyWorkbookReqBody,
    CopyWorkbookReqParams,
} from '../../../../controllers/workbooks/copy-workbook';
import type {CreateWorkbookReqBody} from '../../../../controllers/workbooks/create-workbook';
import type {DeleteWorkbookReqParams} from '../../../../controllers/workbooks/delete-workbook';
import type {DeleteWorkbooksListReqBody} from '../../../../controllers/workbooks/delete-workbooks-list';
import type {
    MoveWorkbookReqBody,
    MoveWorkbookReqParams,
} from '../../../../controllers/workbooks/move-workbook';
import type {MoveWorkbooksListReqBody} from '../../../../controllers/workbooks/move-workbooks-list';
import type {
    UpdateWorkbookReqBody,
    UpdateWorkbookReqParams,
} from '../../../../controllers/workbooks/update-workbook';
import type {CollectionModel} from '../../../../db/models/new/collection';
import type {WorkbookModel} from '../../../../db/models/new/workbook';

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

    CreateWorkbookSuccess = 'createWorkbookSuccess',
    CreateWorkbookFail = 'createWorkbookFail',

    UpdateWorkbookSuccess = 'updateWorkbookSuccess',
    UpdateWorkbookFail = 'updateWorkbookFail',

    CopyWorkbookSuccess = 'copyWorkbookSuccess',
    CopyWorkbookFail = 'copyWorkbookFail',

    DeleteWorkbookSuccess = 'deleteWorkbookSuccess',
    DeleteWorkbookFail = 'deleteWorkbookFail',

    DeleteWorkbooksListSuccess = 'deleteWorkbooksListSuccess',
    DeleteWorkbooksListFail = 'deleteWorkbooksListFail',

    MoveWorkbookSuccess = 'moveWorkbookSuccess',
    MoveWorkbookFail = 'moveWorkbookFail',

    MoveWorkbooksListSuccess = 'moveWorkbooksListSuccess',
    MoveWorkbooksListFail = 'moveWorkbooksListFail',
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

export interface LogEventCreateWorkbookSuccessParams extends EventParams {
    type: LogEventType.CreateWorkbookSuccess;

    reqBody: CreateWorkbookReqBody;
    workbook: WorkbookModel;
}

export interface LogEventCreateWorkbookFailParams extends EventParams {
    type: LogEventType.CreateWorkbookFail;

    reqBody: CreateWorkbookReqBody;
    error: unknown;
}

export interface LogEventUpdateWorkbookSuccessParams extends EventParams {
    type: LogEventType.UpdateWorkbookSuccess;

    reqBody: UpdateWorkbookReqBody;
    reqParams: UpdateWorkbookReqParams;
    workbook: WorkbookModel;
}

export interface LogEventUpdateWorkbookFailParams extends EventParams {
    type: LogEventType.UpdateWorkbookFail;

    reqBody: UpdateWorkbookReqBody;
    reqParams: UpdateWorkbookReqParams;
    error: unknown;
}

export interface LogEventCopyWorkbookSuccessParams extends EventParams {
    type: LogEventType.CopyWorkbookSuccess;

    reqBody: CopyWorkbookReqBody;
    reqParams: CopyWorkbookReqParams;
    workbook: WorkbookModel;
}

export interface LogEventCopyWorkbookFailParams extends EventParams {
    type: LogEventType.CopyWorkbookFail;

    reqBody: CopyWorkbookReqBody;
    reqParams: CopyWorkbookReqParams;
    error: unknown;
}

export interface LogEventMoveWorkbookSuccessParams extends EventParams {
    type: LogEventType.MoveWorkbookSuccess;

    reqBody: MoveWorkbookReqBody;
    reqParams: MoveWorkbookReqParams;
    workbook: WorkbookModel;
}

export interface LogEventMoveWorkbookFailParams extends EventParams {
    type: LogEventType.MoveWorkbookFail;

    reqBody: MoveWorkbookReqBody;
    reqParams: MoveWorkbookReqParams;
    error: unknown;
}

export interface LogEventDeleteWorkbookSuccessParams extends EventParams {
    type: LogEventType.DeleteWorkbookSuccess;

    reqParams: DeleteWorkbookReqParams;
    workbooks: WorkbookModel[];
}

export interface LogEventDeleteWorkbookFailParams extends EventParams {
    type: LogEventType.DeleteWorkbookFail;

    reqParams: DeleteWorkbookReqParams;
    error: unknown;
}

export interface LogEventDeleteWorkbooksListSuccessParams extends EventParams {
    type: LogEventType.DeleteWorkbooksListSuccess;

    reqBody: DeleteWorkbooksListReqBody;
    workbooks: WorkbookModel[];
}

export interface LogEventDeleteWorkbooksListFailParams extends EventParams {
    type: LogEventType.DeleteWorkbooksListFail;

    reqBody: DeleteWorkbooksListReqBody;
    error: unknown;
}

export interface LogEventMoveWorkbooksListSuccessParams extends EventParams {
    type: LogEventType.MoveWorkbooksListSuccess;

    reqBody: MoveWorkbooksListReqBody;
    workbooks: WorkbookModel[];
}

export interface LogEventMoveWorkbooksListFailParams extends EventParams {
    type: LogEventType.MoveWorkbooksListFail;

    reqBody: MoveWorkbooksListReqBody;
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
    | LogEventDeleteCollectionsListFailParams
    | LogEventCreateWorkbookSuccessParams
    | LogEventCreateWorkbookFailParams
    | LogEventUpdateWorkbookSuccessParams
    | LogEventUpdateWorkbookFailParams
    | LogEventCopyWorkbookSuccessParams
    | LogEventCopyWorkbookFailParams
    | LogEventMoveWorkbookSuccessParams
    | LogEventMoveWorkbookFailParams
    | LogEventDeleteWorkbookSuccessParams
    | LogEventDeleteWorkbookFailParams
    | LogEventDeleteWorkbooksListSuccessParams
    | LogEventDeleteWorkbooksListFailParams
    | LogEventMoveWorkbooksListSuccessParams
    | LogEventMoveWorkbooksListFailParams;

export type LogEvent = (params: LogEventParams) => void;
