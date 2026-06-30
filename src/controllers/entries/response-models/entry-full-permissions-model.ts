import {z} from '../../../components/zod';
import {EntryScope} from '../../../db/models/new/entry/types';
import type {ComputeEntryPermissions} from '../../../entities/compute-entry/types';
import type {Permissions as SharedEntryPermissions} from '../../../entities/shared-entry/types';

import {computeEntryPermissionsModel} from './compute-entry-permissions-model';
import {sharedEntryPermissionsModel} from './shared-entry-permissions-model';

const schema = z
    .union([sharedEntryPermissionsModel.schema, computeEntryPermissionsModel.schema])
    .describe('Collection entry permissions (shared or compute)');

const format = (
    data: SharedEntryPermissions | ComputeEntryPermissions,
    scope: EntryScope,
): z.infer<typeof schema> => {
    return scope === EntryScope.Compute
        ? computeEntryPermissionsModel.format(data as ComputeEntryPermissions)
        : sharedEntryPermissionsModel.format(data as SharedEntryPermissions);
};

export const entryFullPermissionsModel = {
    schema,
    format,
};
