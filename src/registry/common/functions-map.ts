import {makeFunctionTemplate} from '../utils/make-function-template';
import type {BulkFetchCollectionsAllPermissions} from './entities/collection/types';
import type {BulkFetchWorkbooksAllPermissions} from './entities/workbook/types';
import type {CheckOrganizationPermission, CheckProjectPermission} from './components/iam/types';
import type {IsNeedBypassEntryByKey} from './utils/entry/types';
import type {ColorPalettesAdminValidator} from './utils/color-palettes/types';
import type {CheckEmbeddingAvailability} from './utils/embedding/types';
import type {GetZitadelUserRole} from '../zitadel/types';

export const commonFunctionsMap = {
    bulkFetchWorkbooksAllPermissions: makeFunctionTemplate<BulkFetchWorkbooksAllPermissions>(),
    bulkFetchCollectionsAllPermissions: makeFunctionTemplate<BulkFetchCollectionsAllPermissions>(),
    checkOrganizationPermission: makeFunctionTemplate<CheckOrganizationPermission>(),
    checkProjectPermission: makeFunctionTemplate<CheckProjectPermission>(),
    isNeedBypassEntryByKey: makeFunctionTemplate<IsNeedBypassEntryByKey>(),
    colorPalettesAdminValidator: makeFunctionTemplate<ColorPalettesAdminValidator>(),
    checkEmbeddingAvailability: makeFunctionTemplate<CheckEmbeddingAvailability>(),
    getZitadelUserRole: makeFunctionTemplate<GetZitadelUserRole>(),
} as const;
