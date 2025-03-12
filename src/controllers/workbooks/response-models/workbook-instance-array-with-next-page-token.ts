import {z} from '../../../components/zod';
import type {WorkbookInstance} from '../../../registry/common/entities/workbook/types';

import {WorkbookModelArray} from './workbook-model-array';

const schema = z
    .object({
        workbooks: WorkbookModelArray.schema,
        nextPageToken: z.string().optional(),
    })
    .describe('Workbook instance array with nextPageToken');

export type WorkbookInstanceArrayWithNextPageTokenResponseModel = z.infer<typeof schema>;

const format = ({
    workbooks,
    nextPageToken,
}: {
    workbooks: WorkbookInstance[];
    nextPageToken?: string;
}): WorkbookInstanceArrayWithNextPageTokenResponseModel => {
    return {
        workbooks: WorkbookModelArray.format(workbooks),
        nextPageToken,
    };
};

export const WorkbookInstanceArrayWithNextPageToken = {
    schema,
    format,
};
