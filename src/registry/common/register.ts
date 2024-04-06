import {DLS} from './components/dls/dls';
import {Workbook} from './entities/workbook/workbook';
import {Collection} from './entities/collection/collection';
import {bulkFetchWorkbooksAllPermissions} from './entities/workbook/utils';
import {bulkFetchCollectionsAllPermissions} from './entities/collection/utils';
import {checkOrganizationPermission, checkProjectPermission} from './components/iam/utils';
import {isNeedBypassEntryByKey} from './utils/entry/utils';
import {colorPalettesAdminValidator} from './utils/color-palettes/utils';
import {checkBusinessRate} from './utils/billing/utils';

import {registry} from '../index';

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
        checkBusinessRate,
    });
};
