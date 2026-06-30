import {z} from 'zod';

import {EntryScope} from '../../../db/models/new/entry/types';
import {ALLOWED_COLLECTION_ENTRY_SCOPES} from '../../../entities/shared-entry';

export const collectionEntryScope = () =>
    z.enum(EntryScope).refine((val) => ALLOWED_COLLECTION_ENTRY_SCOPES.includes(val), {
        error: `Must be one of the values: ${ALLOWED_COLLECTION_ENTRY_SCOPES.join(', ')}`,
    });
