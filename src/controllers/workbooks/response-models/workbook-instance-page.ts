import {z} from '../../../components/zod';
import type {WorkbookInstance} from '../../../registry/common/entities/workbook/types';

import {WorkbookInstanceArray} from './workbook-instance-array';

const schema = z
    .object({
        workbooks: WorkbookInstanceArray.schema,
        nextPageToken: z.string().optional(),
    })
    .describe('Workbook instance page');

export type WorkbookInstancePageResponseModel = z.infer<typeof schema>;

const format = ({
    workbooks,
    nextPageToken,
}: {
    workbooks: WorkbookInstance[];
    nextPageToken?: string;
}): WorkbookInstancePageResponseModel => {
    return {
        workbooks: WorkbookInstanceArray.format(workbooks),
        nextPageToken,
    };
};

export const WorkbookInstancePage = {
    schema,
    format,
};
