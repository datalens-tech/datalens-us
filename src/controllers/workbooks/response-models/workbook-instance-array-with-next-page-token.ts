import {z} from '../../../components/zod';
import type {WorkbookInstance} from '../../../registry/common/entities/workbook/types';

import {WorkbookInstanceArray} from './workbook-instance-array';

const schema = z
    .object({
        workbooks: WorkbookInstanceArray.schema,
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
        workbooks: WorkbookInstanceArray.format(workbooks),
        nextPageToken,
    };
};

export const WorkbookInstanceArrayWithNextPageToken = {
    schema,
    format,
};
