import {objectKeys} from '../../utils/utility-types';

import {Permissions, SharedEntryPermission} from './types';

export function getSharedEntryDisabledPermissions(): Permissions {
    return objectKeys(SharedEntryPermission).reduce((acc, key) => {
        const value = SharedEntryPermission[key];
        acc[value] = false;
        return acc;
    }, {} as Permissions);
}
