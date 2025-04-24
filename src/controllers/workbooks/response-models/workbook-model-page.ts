import {z} from '../../../components/zod';
import {WorkbookModel} from '../../../db/models/new/workbook';

import {workbookModelArray} from './workbook-model-array';

const schema = z
    .object({
        workbooks: workbookModelArray.schema,
        nextPageToken: z.string().optional(),
    })
    .describe('Workbook model page');

export type WorkbookModelPage = z.infer<typeof schema>;

const format = async (data: {
    workbooks: WorkbookModel[];
    nextPageToken?: string;
}): Promise<WorkbookModelPage> => {
    return {
        workbooks: await workbookModelArray.format(data.workbooks),
        nextPageToken: data.nextPageToken,
    };
};

export const workbookModelPage = {
    schema,
    format,
};
