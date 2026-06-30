import {ServiceArgs} from '../../types';
import {EntryFullPermissions, EntryWithPermissions, PartialEntry} from '../types';

import {
    CheckEntriesByPermissionArgs,
    checkEntriesByPermission,
} from './check-entries-by-permission';

export const filterEntriesByPermission = async <T extends PartialEntry>(
    {ctx, trx}: ServiceArgs,
    args: CheckEntriesByPermissionArgs<T>,
): Promise<EntryWithPermissions<T, EntryFullPermissions>[]> => {
    const entries = await checkEntriesByPermission({ctx, trx}, args);

    return entries.filter((entry) => !((entry.workbookId || entry.collectionId) && entry.isLocked));
};
