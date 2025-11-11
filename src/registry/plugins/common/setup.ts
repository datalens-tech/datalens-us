import {registry} from '../../index';

import {DLS} from './components/dls/dls';
import {checkOrganizationPermission} from './components/iam/utils';
import {Collection} from './entities/collection/collection';
import {SharedEntry} from './entities/shared-entry/shared-entry';
import {Workbook} from './entities/workbook/workbook';
import {checkColorPalettesAdmin} from './utils/color-palettes/utils';
import {checkEmbedding} from './utils/embedding/utils';
import {
    checkLicense,
    fetchAndValidateLicenseOrFail,
    getEntryAddFormattedFieldsHook,
    getEntryBeforeDbRequestHook,
    getEntryResolveUserLogin,
    isLicenseRequired,
    isNeedBypassEntryByKey,
} from './utils/entry/utils';
import {logEvent} from './utils/log-event/utils';
import {checkTenant, getServicePlan, processTenantSettings} from './utils/tenant/utils';
import {getZitadelUserRole} from './zitadel/utils';

export const setupCommonPlugin = () => {
    registry.common.classes.register({
        DLS,
        Workbook,
        Collection,
        SharedEntry,
    });

    registry.common.functions.register({
        checkOrganizationPermission,
        isNeedBypassEntryByKey,
        getEntryBeforeDbRequestHook,
        getEntryAddFormattedFieldsHook,
        getEntryResolveUserLogin,
        isLicenseRequired,
        checkLicense,
        fetchAndValidateLicenseOrFail,
        checkEmbedding,
        logEvent,
        checkTenant,
        getServicePlan,
        processTenantSettings,
        getZitadelUserRole,
        checkColorPalettesAdmin,
    });
};
