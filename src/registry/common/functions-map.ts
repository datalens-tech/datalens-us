import {makeFunctionTemplate} from '../utils/make-function-template';
import type {GetZitadelUserRole} from '../zitadel/types';

import type {CheckOrganizationPermission, CheckProjectPermission} from './components/iam/types';
import type {BulkFetchCollectionsAllPermissions} from './entities/collection/types';
import type {BulkFetchWorkbooksAllPermissions} from './entities/workbook/types';
import type {ColorPalettesAdminValidator} from './utils/color-palettes/types';
import type {
    OnCreateCollectionError,
    OnCreateCollectionSuccess,
    OnDeleteCollectionError,
    OnDeleteCollectionSuccess,
    OnDeleteCollectionsListError,
    OnDeleteCollectionsListSuccess,
    OnMoveCollectionError,
    OnMoveCollectionSuccess,
    OnMoveCollectionsListError,
    OnMoveCollectionsListSuccess,
    OnUpdateCollectionError,
    OnUpdateCollectionSuccess,
} from './utils/controllers-callbacks/collections';
import type {CheckEmbedding} from './utils/embedding/types';
import type {
    CheckCreateEntryAvailability,
    CheckUpdateEntryAvailability,
    GetEntryAddFormattedFieldsHook,
    GetEntryBeforeDbRequestHook,
    IsNeedBypassEntryByKey,
} from './utils/entry/types';

export const commonFunctionsMap = {
    bulkFetchWorkbooksAllPermissions: makeFunctionTemplate<BulkFetchWorkbooksAllPermissions>(),
    bulkFetchCollectionsAllPermissions: makeFunctionTemplate<BulkFetchCollectionsAllPermissions>(),
    checkOrganizationPermission: makeFunctionTemplate<CheckOrganizationPermission>(),
    checkProjectPermission: makeFunctionTemplate<CheckProjectPermission>(),
    isNeedBypassEntryByKey: makeFunctionTemplate<IsNeedBypassEntryByKey>(),
    colorPalettesAdminValidator: makeFunctionTemplate<ColorPalettesAdminValidator>(),
    getZitadelUserRole: makeFunctionTemplate<GetZitadelUserRole>(),
    getEntryBeforeDbRequestHook: makeFunctionTemplate<GetEntryBeforeDbRequestHook>(),
    getEntryAddFormattedFieldsHook: makeFunctionTemplate<GetEntryAddFormattedFieldsHook>(),
    checkEmbedding: makeFunctionTemplate<CheckEmbedding>(),
    checkCreateEntryAvailability: makeFunctionTemplate<CheckCreateEntryAvailability>(),
    checkUpdateEntryAvailability: makeFunctionTemplate<CheckUpdateEntryAvailability>(),

    controllersCallbacks: {
        onCreateCollectionError: makeFunctionTemplate<OnCreateCollectionError>(),
        onCreateCollectionSuccess: makeFunctionTemplate<OnCreateCollectionSuccess>(),
        onMoveCollectionError: makeFunctionTemplate<OnMoveCollectionError>(),
        onMoveCollectionSuccess: makeFunctionTemplate<OnMoveCollectionSuccess>(),
        onMoveCollectionsListError: makeFunctionTemplate<OnMoveCollectionsListError>(),
        onMoveCollectionsListSuccess: makeFunctionTemplate<OnMoveCollectionsListSuccess>(),
        onUpdateCollectionError: makeFunctionTemplate<OnUpdateCollectionError>(),
        onUpdateCollectionSuccess: makeFunctionTemplate<OnUpdateCollectionSuccess>(),
        onDeleteCollectionError: makeFunctionTemplate<OnDeleteCollectionError>(),
        onDeleteCollectionSuccess: makeFunctionTemplate<OnDeleteCollectionSuccess>(),
        onDeleteCollectionsListError: makeFunctionTemplate<OnDeleteCollectionsListError>(),
        onDeleteCollectionsListSuccess: makeFunctionTemplate<OnDeleteCollectionsListSuccess>(),
    },
} as const;
