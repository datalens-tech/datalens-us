import {objectKeys} from '../../utils/utility-types';

import {ComputeEntryPermission, ComputeEntryPermissions} from './types';

export function getComputeEntryDisabledPermissions(): ComputeEntryPermissions {
    return objectKeys(ComputeEntryPermission).reduce((acc, key) => {
        const value = ComputeEntryPermission[key];
        acc[value] = false;
        return acc;
    }, {} as ComputeEntryPermissions);
}

export function getComputeEntryEnabledPermissions(): ComputeEntryPermissions {
    return objectKeys(ComputeEntryPermission).reduce((acc, key) => {
        const value = ComputeEntryPermission[key];
        acc[value] = true;
        return acc;
    }, {} as ComputeEntryPermissions);
}
