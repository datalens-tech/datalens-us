import {z} from '../../../components/zod';

import {WorkbookIdModel} from './workbook-id-model';

const schema = WorkbookIdModel.schema
    .merge(
        z.object({
            isTemplate: z.boolean(),
        }),
    )
    .describe('Workbook id with template model');

export type WorkbookIdWithTemplateResponseModel = z.infer<typeof schema>;

const format = (data: {
    workbookId: string;
    isTemplate: boolean;
}): WorkbookIdWithTemplateResponseModel => {
    return {
        ...WorkbookIdModel.format(data),
        isTemplate: data.isTemplate,
    };
};

export const WorkbookIdWithTemplateModel = {
    schema,
    format,
};
