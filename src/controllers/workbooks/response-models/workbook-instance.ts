import {z} from '../../../components/zod';
import type {WorkbookInstance} from '../../../registry/common/entities/workbook/types';

import {workbookModel} from './workbook-model';

const schema = workbookModel.schema
    .merge(
        z.object({
            permissions: z
                .object({
                    listAccessBindings: z.boolean(),
                    updateAccessBindings: z.boolean(),
                    limitedView: z.boolean(),
                    view: z.boolean(),
                    update: z.boolean(),
                    copy: z.boolean(),
                    move: z.boolean(),
                    publish: z.boolean(),
                    embed: z.boolean(),
                    delete: z.boolean(),
                })
                .optional(),
        }),
    )
    .describe('Workbook instance');

export type WorkbookInstanceResponseModel = z.infer<typeof schema>;

const format = (data: WorkbookInstance): WorkbookInstanceResponseModel => {
    const {model} = data;

    return {
        ...workbookModel.format(model),
        permissions: data.permissions,
    };
};

export const workbookInstance = {
    schema,
    format,
};
