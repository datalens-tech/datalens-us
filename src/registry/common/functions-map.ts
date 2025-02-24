import {makeFunctionTemplate} from '../utils/make-function-template';
import type {GetZitadelUserRole} from '../zitadel/types';

import type {CheckOrganizationPermission} from './components/iam/types';
import type {BulkFetchCollectionsAllPermissions} from './entities/collection/types';
import type {BulkFetchWorkbooksAllPermissions} from './entities/workbook/types';
import type {ColorPalettesAdminValidator} from './utils/color-palettes/types';
import type {CheckEmbedding} from './utils/embedding/types';
import type {
    CheckCreateEntryAvailability,
    CheckUpdateEntryAvailability,
    GetEntryAddFormattedFieldsHook,
    GetEntryBeforeDbRequestHook,
    IsNeedBypassEntryByKey,
} from './utils/entry/types';
import type {LogEvent} from './utils/log-event/types';
import type {CheckTenant, GetServicePlan} from './utils/tenant/types';

export const commonFunctionsMap = {
    bulkFetchWorkbooksAllPermissions: makeFunctionTemplate<BulkFetchWorkbooksAllPermissions>(),
    bulkFetchCollectionsAllPermissions: makeFunctionTemplate<BulkFetchCollectionsAllPermissions>(),
    checkOrganizationPermission: makeFunctionTemplate<CheckOrganizationPermission>(),
    isNeedBypassEntryByKey: makeFunctionTemplate<IsNeedBypassEntryByKey>(),
    colorPalettesAdminValidator: makeFunctionTemplate<ColorPalettesAdminValidator>(),
    getZitadelUserRole: makeFunctionTemplate<GetZitadelUserRole>(),
    getEntryBeforeDbRequestHook: makeFunctionTemplate<GetEntryBeforeDbRequestHook>(),
    getEntryAddFormattedFieldsHook: makeFunctionTemplate<GetEntryAddFormattedFieldsHook>(),
    checkEmbedding: makeFunctionTemplate<CheckEmbedding>(),
    checkCreateEntryAvailability: makeFunctionTemplate<CheckCreateEntryAvailability>(),
    checkUpdateEntryAvailability: makeFunctionTemplate<CheckUpdateEntryAvailability>(),
    logEvent: makeFunctionTemplate<LogEvent>(),
    checkTenant: makeFunctionTemplate<CheckTenant>(),
    getServicePlan: makeFunctionTemplate<GetServicePlan>(),
} as const;
