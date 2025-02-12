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
import type {CreateColorPaletteReqBody} from '../../../../controllers/color-palettes/create-color-palette';
import type {DeleteColorPaletteReqParams} from '../../../../controllers/color-palettes/delete-color-palette';
import type {
    UpdateColorPaletteReqBody,
    UpdateColorPaletteReqParams,
} from '../../../../controllers/color-palettes/update-color-palette';
import type {CopyEntriesToWorkbookReqBody} from '../../../../controllers/entries/copy-entries-to-workbook';
import type {DeleteEntryReqParams} from '../../../../controllers/entries/delete-entry';
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
import OldEntry from '../../../../db/models/entry';
import type {CollectionModel} from '../../../../db/models/new/collection';
import {ColorPaletteModel} from '../../../../db/models/new/color-palette';
import {Entry} from '../../../../db/models/new/entry';
import type {WorkbookModel} from '../../../../db/models/new/workbook';
import type {EntryType} from '../../../../types/models';

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

    CreateColorPaletteSuccess = 'createColorPaletteSuccess',
    CreateColorPaletteFail = 'createColorPaletteFail',

    UpdateColorPaletteSuccess = 'updateColorPaletteSuccess',
    UpdateColorPaletteFail = 'updateColorPaletteFail',

    DeleteColorPaletteSuccess = 'deleteColorPaletteSuccess',
    DeleteColorPaletteFail = 'deleteColorPaletteFail',

    CopyEntriesToWorkbookSuccess = 'copyEntriesToWorkbookSuccess',
    CopyEntriesToWorkbookFail = 'copyEntriesToWorkbookFail',

    CopyEntryToWorkbookSuccess = 'copyEntryToWorkbookSuccess',
    CopyEntryToWorkbookFail = 'copyEntryToWorkbookFail',

    CreateEntrySuccess = 'createEntrySuccess',
    CreateEntryFail = 'createEntryFail',

    CreateEntryAltSuccess = 'createEntryAltSuccess',
    CreateEntryAltFail = 'createEntryAltFail',

    DeleteEntrySuccess = 'deleteEntrySuccess',
    DeleteEntryFail = 'deleteEntryFail',

    RenameEntrySuccess = 'renameEntrySuccess',
    RenameEntryFail = 'renameEntryFail',

    UpdateEntrySuccess = 'updateEntrySuccess',
    UpdateEntryFail = 'updateEntryFail',
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

export interface LogEventCreateColorPaletteSuccessParams extends EventParams {
    type: LogEventType.CreateColorPaletteSuccess;

    reqBody: CreateColorPaletteReqBody;
    colorPalette: ColorPaletteModel;
}

export interface LogEventCreateColorPaletteFailParams extends EventParams {
    type: LogEventType.CreateColorPaletteFail;

    reqBody: CreateColorPaletteReqBody;
    error: unknown;
}

export interface LogEventUpdateColorPaletteSuccessParams extends EventParams {
    type: LogEventType.UpdateColorPaletteSuccess;

    reqParams: UpdateColorPaletteReqParams;
    reqBody: UpdateColorPaletteReqBody;
    colorPalette: ColorPaletteModel;
}

export interface LogEventUpdateColorPaletteFailParams extends EventParams {
    type: LogEventType.UpdateColorPaletteFail;

    reqParams: UpdateColorPaletteReqParams;
    reqBody: UpdateColorPaletteReqBody;
    error: unknown;
}

export interface LogEventDeleteColorPaletteSuccessParams extends EventParams {
    type: LogEventType.DeleteColorPaletteSuccess;

    reqParams: DeleteColorPaletteReqParams;
    colorPalette: ColorPaletteModel;
}

export interface LogEventDeleteColorPaletteFailParams extends EventParams {
    type: LogEventType.DeleteColorPaletteFail;

    reqParams: DeleteColorPaletteReqParams;
    error: unknown;
}

export interface LogEventCopyEntriesToWorkbookSuccessParams extends EventParams {
    type: LogEventType.CopyEntriesToWorkbookSuccess;

    reqBody: CopyEntriesToWorkbookReqBody;
    data: {
        workbookId: string;
    };
}

export interface LogEventCopyEntriesToWorkbookFailParams extends EventParams {
    type: LogEventType.CopyEntriesToWorkbookFail;

    reqBody: CopyEntriesToWorkbookReqBody;
    error: unknown;
}

export interface LogEventDeleteEntrySuccessParams extends EventParams {
    type: LogEventType.DeleteEntrySuccess;

    reqParams: DeleteEntryReqParams;
    entry: OldEntry | undefined;
}

export interface LogEventDeleteEntryFailParams extends EventParams {
    type: LogEventType.DeleteEntryFail;

    reqParams: DeleteEntryReqParams;
    error: unknown;
}

type CopyEntryToWorkbookReqParams = {
    entryId?: string;
    workbookId?: string;
};

export interface LogEventCopyEntryToWorkbookSuccessParams extends EventParams {
    type: LogEventType.CopyEntryToWorkbookSuccess;

    reqParams: CopyEntryToWorkbookReqParams;
    entry: Entry;
}

export interface LogEventCopyEntryToWorkbookFailParams extends EventParams {
    type: LogEventType.CopyEntryToWorkbookFail;

    reqParams: CopyEntryToWorkbookReqParams;
    error: unknown;
}

type CreateEntryReqParams = {
    workbookId?: string;
    name?: string;
    scope?: string;
    type?: string;
    key?: string;
    recursion?: boolean;
};

export interface LogEventCreateEntrySuccessParams extends EventParams {
    type: LogEventType.CreateEntrySuccess;

    reqParams: CreateEntryReqParams;
    data: OldEntry | OldEntry[] | undefined;
}

export interface LogEventCreateEntryFailParams extends EventParams {
    type: LogEventType.CreateEntryFail;

    reqParams: CreateEntryReqParams;
    error: unknown;
}

type CreateEntryAltReqParams = {
    workbookId?: string;
    name?: string;
    scope?: string;
    type?: string;
    key?: string;
    recursion?: boolean;
};

export interface LogEventCreateEntryAltSuccessParams extends EventParams {
    type: LogEventType.CreateEntryAltSuccess;

    reqParams: CreateEntryAltReqParams;
    data: Entry | EntryType | EntryType[] | undefined;
}

export interface LogEventCreateEntryAltFailParams extends EventParams {
    type: LogEventType.CreateEntryAltFail;

    reqParams: CreateEntryAltReqParams;
    error: unknown;
}

type RenameEntryReqParams = {
    entryId?: string;
    name?: string;
};

export interface LogEventRenameEntrySuccessParams extends EventParams {
    type: LogEventType.RenameEntrySuccess;

    reqParams: RenameEntryReqParams;
    data: OldEntry[];
}

export interface LogEventRenameEntryFailParams extends EventParams {
    type: LogEventType.RenameEntryFail;

    reqParams: RenameEntryReqParams;
    error: unknown;
}

type UpdateEntryReqParams = {
    entryId?: string;
    name?: string;
};

export interface LogEventUpdateEntrySuccessParams extends EventParams {
    type: LogEventType.UpdateEntrySuccess;

    reqParams: UpdateEntryReqParams;
    data: OldEntry | undefined;
}

export interface LogEventUpdateEntryFailParams extends EventParams {
    type: LogEventType.UpdateEntryFail;

    reqParams: UpdateEntryReqParams;
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
    | LogEventMoveWorkbooksListFailParams
    | LogEventCreateColorPaletteSuccessParams
    | LogEventCreateColorPaletteFailParams
    | LogEventUpdateColorPaletteSuccessParams
    | LogEventUpdateColorPaletteFailParams
    | LogEventDeleteColorPaletteSuccessParams
    | LogEventDeleteColorPaletteFailParams
    | LogEventCopyEntriesToWorkbookSuccessParams
    | LogEventCopyEntriesToWorkbookFailParams
    | LogEventDeleteEntrySuccessParams
    | LogEventDeleteEntryFailParams
    | LogEventCopyEntryToWorkbookSuccessParams
    | LogEventCopyEntryToWorkbookFailParams
    | LogEventCreateEntrySuccessParams
    | LogEventCreateEntryFailParams
    | LogEventCreateEntryAltSuccessParams
    | LogEventCreateEntryAltFailParams
    | LogEventRenameEntrySuccessParams
    | LogEventRenameEntryFailParams
    | LogEventUpdateEntrySuccessParams
    | LogEventUpdateEntryFailParams;

export type LogEvent = (params: LogEventParams) => void;
