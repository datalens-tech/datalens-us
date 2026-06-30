import {filterUnversionedData} from '../../../components/private-permissions';
import {z} from '../../../components/zod';
import {CreatedEntry} from '../../../services/entry.service';
import {PrivatePermissions} from '../../../types/models';
import Utils from '../../../utils';
import {operation as operationModel} from '../../response-models';

import {entryPermissionsModel} from './entry-permissions-model';
import {entryRevisionModel} from './entry-revision-schema';

const entrySchema = z
    .object({
        ...entryRevisionModel.schema.shape,
        unversionedData: z.record(z.string(), z.unknown()).nullish(),
        permissions: entryPermissionsModel.schema.optional(),
        operation: operationModel.schema.optional(),
    })
    .describe('Create entry model');

const schema = z.union([entrySchema, z.array(entrySchema)]).describe('Create entry model');

const formatEntry = (
    data: CreatedEntry,
    privatePermissions: PrivatePermissions,
): z.infer<typeof entrySchema> => ({
    ...entryRevisionModel.format(data),
    links: data.links,
    unversionedData: filterUnversionedData(data.scope, data.unversionedData, privatePermissions),
    permissions: data.permissions ? entryPermissionsModel.format(data.permissions) : undefined,
    operation: data.operation ? operationModel.format(data.operation) : undefined,
});

const format = async (
    data: CreatedEntry | CreatedEntry[],
    privatePermissions: PrivatePermissions,
): Promise<z.infer<typeof schema>> => {
    if (Array.isArray(data)) {
        return Utils.macrotasksMap(data, (entry) => formatEntry(entry, privatePermissions));
    }
    return formatEntry(data, privatePermissions);
};

export const createEntryModel = {schema, format};
