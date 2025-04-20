import {z} from '../../../components/zod';
import {EntryPermissions} from '../../../services/new/entry/types';

const schema = z
    .object({
        execute: z.boolean().optional(),
        read: z.boolean().optional(),
        edit: z.boolean().optional(),
        admin: z.boolean().optional(),
    })
    .describe('Entry permissions model');

const format = (data: EntryPermissions): z.infer<typeof schema> => {
    return {
        execute: data.execute,
        read: data.read,
        edit: data.edit,
        admin: data.admin,
    };
};

export const entryPermissionsModel = {
    schema,
    format,
};
