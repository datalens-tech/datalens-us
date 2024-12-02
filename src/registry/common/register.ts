import {registry} from '../index';
import {getZitadelUserRole} from '../zitadel/utils';

import {DLS} from './components/dls/dls';
import {checkOrganizationPermission, checkProjectPermission} from './components/iam/utils';
import {Collection} from './entities/collection/collection';
import {bulkFetchCollectionsAllPermissions} from './entities/collection/utils';
import {bulkFetchWorkbooksAllPermissions} from './entities/workbook/utils';
import {Workbook} from './entities/workbook/workbook';
import {colorPalettesAdminValidator} from './utils/color-palettes/utils';
import {checkEmbedding} from './utils/embedding/utils';
import {
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
        checkProjectPermission,
        isNeedBypassEntryByKey,
        colorPalettesAdminValidator,
        getZitadelUserRole,
        getEntryBeforeDbRequestHook,
        getEntryAddFormattedFieldsHook,
        checkEmbedding,
    });
};
