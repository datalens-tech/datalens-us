import {z} from '../../../components/zod';
import {WorkbookModel} from '../../../db/models/new/workbook';

import {WorkbookModelArray} from './workbook-model-array';

const schema = z
    .object({
        workbooks: WorkbookModelArray.schema,
        nextPageToken: z.string().optional(),
    })
    .describe('Workbook instance array with nextPageToken');

export type WorkbookModelArrayWithNextPageTokenResponseModel = z.infer<typeof schema>;

const format = ({
    workbooks,
    nextPageToken,
}: {
    workbooks: WorkbookModel[];
    nextPageToken?: string;
}): WorkbookModelArrayWithNextPageTokenResponseModel => {
    return {
        workbooks: WorkbookModelArray.format(workbooks),
        nextPageToken,
    };
};

export const WorkbookModelArrayWithNextPageToken = {
    schema,
    format,
};
