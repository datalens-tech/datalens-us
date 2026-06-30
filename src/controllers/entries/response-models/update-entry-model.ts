import {filterUnversionedData} from '../../../components/private-permissions';
import {z} from '../../../components/zod';
import {UpdatedEntry} from '../../../services/entry/actions/update-entry';
import {PrivatePermissions} from '../../../types/models';

import {entryReturnColumnsModel} from './entry-return-columns-model';

const schema = z
    .object({
        ...entryReturnColumnsModel.schema.shape,
        links: z.record(z.string(), z.unknown()).nullable().optional(),
        unversionedData: z.record(z.string(), z.unknown()).nullish(),
    })
    .describe('Update entry model');

const format = (
    data: UpdatedEntry,
    privatePermissions: PrivatePermissions,
): z.infer<typeof schema> => ({
    ...entryReturnColumnsModel.format(data),
    links: data.links,
    unversionedData: filterUnversionedData(data.scope, data.unversionedData, privatePermissions),
});

export const updateEntryModel = {schema, format};
