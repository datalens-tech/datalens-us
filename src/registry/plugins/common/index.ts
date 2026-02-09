import {
    createClassesRegistry,
    createFunctionsRegistry,
    makeClassTemplate,
    makeFunctionTemplate,
} from '../../utils';

import type {DLSConstructor} from './components/dls/types';
import type {CheckOrganizationPermission} from './components/iam/types';
import type {CollectionConstructor} from './entities/collection/types';
import type {SharedEntryConstructor} from './entities/shared-entry/types';
import type {WorkbookConstructor} from './entities/workbook/types';
import type {CheckColorPalettesAdmin} from './utils/color-palettes/types';
import type {CheckEmbedding} from './utils/embedding/types';
import type {
    CheckLicense,
    FetchAndValidateLicense,
    GetEntryAddFormattedFieldsHook,
    GetEntryBeforeDbRequestHook,
    GetEntryResolveUserLogin,
    IsLicenseRequired,
    IsNeedBypassEntryByKey,
} from './utils/entry/types';
import type {LogEvent} from './utils/log-event/types';
import type {CheckTenant, GetServicePlan, ProcessTenantSettings} from './utils/tenant/types';

export const commonPlugin = {
    classes: createClassesRegistry({
        DLS: makeClassTemplate<DLSConstructor>(),
        Workbook: makeClassTemplate<WorkbookConstructor>(),
        Collection: makeClassTemplate<CollectionConstructor>(),
        SharedEntry: makeClassTemplate<SharedEntryConstructor>(),
    }),
    functions: createFunctionsRegistry({
        checkOrganizationPermission: makeFunctionTemplate<CheckOrganizationPermission>(),
        isNeedBypassEntryByKey: makeFunctionTemplate<IsNeedBypassEntryByKey>(),
        getEntryBeforeDbRequestHook: makeFunctionTemplate<GetEntryBeforeDbRequestHook>(),
        getEntryAddFormattedFieldsHook: makeFunctionTemplate<GetEntryAddFormattedFieldsHook>(),
        getEntryResolveUserLogin: makeFunctionTemplate<GetEntryResolveUserLogin>(),
        checkEmbedding: makeFunctionTemplate<CheckEmbedding>(),
        logEvent: makeFunctionTemplate<LogEvent>(),
        checkTenant: makeFunctionTemplate<CheckTenant>(),
        getServicePlan: makeFunctionTemplate<GetServicePlan>(),
        processTenantSettings: makeFunctionTemplate<ProcessTenantSettings>(),
        checkColorPalettesAdmin: makeFunctionTemplate<CheckColorPalettesAdmin>(),
        isLicenseRequired: makeFunctionTemplate<IsLicenseRequired>(),
        checkLicense: makeFunctionTemplate<CheckLicense>(),
        fetchAndValidateLicenseOrFail: makeFunctionTemplate<FetchAndValidateLicense>(),
    }),
};
