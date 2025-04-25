import {z} from '../../../components/zod';

import {workbookIdModel} from './workbook-id-model';

const schema = workbookIdModel.schema
    .merge(
        z.object({
            isTemplate: z.boolean(),
        }),
    )
    .describe('Workbook id with isTemplate flag model');

export type WorkbookIdWithTemplateModel = z.infer<typeof schema>;

const format = (data: {workbookId: string; isTemplate: boolean}): WorkbookIdWithTemplateModel => {
    return {
        ...workbookIdModel.format(data),
        isTemplate: data.isTemplate,
    };
};

export const workbookIdWithTemplateModel = {
    schema,
    format,
};
