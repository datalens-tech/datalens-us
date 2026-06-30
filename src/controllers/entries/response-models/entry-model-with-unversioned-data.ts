import {filterUnversionedData} from '../../../components/private-permissions';
import {z} from '../../../components/zod';
import {Entry} from '../../../db/models/new/entry';
import {PrivatePermissions} from '../../../types/models';

import {entryModel} from './entry-model';

const schema = z
    .object({
        ...entryModel.schema.shape,
        unversionedData: z.record(z.string(), z.unknown()).nullish(),
    })
    .describe('Entry model with unversionedData');

export type EntryModelWithUnversionedData = z.infer<typeof schema>;

const format = (
    entry: Entry,
    privatePermissions: PrivatePermissions,
): EntryModelWithUnversionedData => ({
    ...entryModel.format(entry),
    unversionedData: filterUnversionedData(entry.scope, entry.unversionedData, privatePermissions),
});

export const entryModelWithUnversionedData = {
    schema,
    format,
};
