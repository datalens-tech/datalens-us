import {z} from '../../../components/zod';
import {WorkbookModel} from '../../../db/models/new/workbook';

import {WorkbookModelArray} from './workbook-model-array';

const schema = z
    .object({
        workbooks: WorkbookModelArray.schema,
        nextPageToken: z.string().optional(),
    })
    .describe('Workbook Model page');

export type WorkbookModelPageResponseModel = z.infer<typeof schema>;

const format = ({
    workbooks,
    nextPageToken,
}: {
    workbooks: WorkbookModel[];
    nextPageToken?: string;
}): WorkbookModelPageResponseModel => {
    return {
        workbooks: WorkbookModelArray.format(workbooks),
        nextPageToken,
    };
};

export const workbookModelPage = {
    schema,
    format,
};
