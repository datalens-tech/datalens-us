import {z} from '../../../components/zod';
import type {Permissions} from '../../../entities/shared-entry/types';

const schema = z
    .object({
        listAccessBindings: z.boolean(),
        updateAccessBindings: z.boolean(),
        limitedView: z.boolean(),
        view: z.boolean(),
        update: z.boolean(),
        copy: z.boolean(),
        move: z.boolean(),
        delete: z.boolean(),
        createEntryBinding: z.boolean(),
        createLimitedEntryBinding: z.boolean(),
    })
    .describe('Shared entry permissions model');

const format = (data: Permissions): z.infer<typeof schema> => {
    return {
        listAccessBindings: data.listAccessBindings,
        updateAccessBindings: data.updateAccessBindings,
        limitedView: data.limitedView,
        view: data.view,
        update: data.update,
        copy: data.copy,
        move: data.move,
        delete: data.delete,
        createEntryBinding: data.createEntryBinding,
        createLimitedEntryBinding: data.createLimitedEntryBinding,
    };
};

export const sharedEntryPermissionsModel = {
    schema,
    format,
};
