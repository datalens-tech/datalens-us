import {z} from '../../../components/zod';
import type {ComputeEntryPermissions} from '../../../entities/compute-entry/types';

const schema = z
    .object({
        listAccessBindings: z.boolean(),
        updateAccessBindings: z.boolean(),
        get: z.boolean(),
        use: z.boolean(),
        update: z.boolean(),
        delete: z.boolean(),
    })
    .describe('Compute entry permissions model');

const format = (data: ComputeEntryPermissions): z.infer<typeof schema> => {
    return {
        listAccessBindings: data.listAccessBindings,
        updateAccessBindings: data.updateAccessBindings,
        get: data.get,
        use: data.use,
        update: data.update,
        delete: data.delete,
    };
};

export const computeEntryPermissionsModel = {
    schema,
    format,
};
