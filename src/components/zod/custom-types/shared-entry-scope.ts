import {z} from 'zod';

import {EntryScope} from '../../../db/models/new/entry/types';
import {ALLOWED_SHARED_ENTRY_SCOPES} from '../../../entities/shared-entry';

export const sharedEntryScope = () =>
    z.nativeEnum(EntryScope).refine((val) => ALLOWED_SHARED_ENTRY_SCOPES.includes(val), {
        message: `Must be one of the values: ${ALLOWED_SHARED_ENTRY_SCOPES.join(', ')}`,
    });
