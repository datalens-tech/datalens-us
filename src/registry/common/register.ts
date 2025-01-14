import {registry} from '../index';
import {getZitadelUserRole} from '../zitadel/utils';

import {DLS} from './components/dls/dls';
import {checkOrganizationPermission} from './components/iam/utils';
import {Collection} from './entities/collection/collection';
import {bulkFetchCollectionsAllPermissions} from './entities/collection/utils';
import {bulkFetchWorkbooksAllPermissions} from './entities/workbook/utils';
import {Workbook} from './entities/workbook/workbook';
import {colorPalettesAdminValidator} from './utils/color-palettes/utils';
import {checkEmbedding} from './utils/embedding/utils';
import {
    checkCreateEntryAvailability,
    checkUpdateEntryAvailability,
    getEntryAddFormattedFieldsHook,
    getEntryBeforeDbRequestHook,
    isNeedBypassEntryByKey,
} from './utils/entry/utils';

export const registerCommonPlugins = () => {
    registry.common.classes.register({
        DLS,
        Workbook,
        Collection,
    });

    registry.common.functions.register({
        bulkFetchWorkbooksAllPermissions,
        bulkFetchCollectionsAllPermissions,
        checkOrganizationPermission,
        isNeedBypassEntryByKey,
        colorPalettesAdminValidator,
        getZitadelUserRole,
        getEntryBeforeDbRequestHook,
        getEntryAddFormattedFieldsHook,
        checkEmbedding,
        checkCreateEntryAvailability,
        checkUpdateEntryAvailability,
    });
};
