import {ServiceArgs} from '../../types';
import {EntryWithPermissions, PartialEntry} from '../types';

import {
    CheckEntriesByPermissionArgs,
    checkEntriesByPermission,
} from './check-entries-by-permission';

export const filterEntriesByPermission = async <T extends PartialEntry>(
    {ctx, trx}: ServiceArgs,
    args: CheckEntriesByPermissionArgs<T>,
): Promise<EntryWithPermissions<T>[]> => {
    const entries = await checkEntriesByPermission({ctx, trx}, args);

    return entries.filter((entry) => !(entry.workbookId && entry.isLocked));
};
