import {z} from '../../../components/zod';
import type {WorkbookInstance} from '../../../registry/plugins/common/entities/workbook/types';

import {workbookInstanceArray} from './workbook-instance-array';

const schema = z
    .object({
        workbooks: workbookInstanceArray.schema,
        nextPageToken: z.string().optional(),
    })
    .describe('Workbook instance page');

export type WorkbookInstancePage = z.infer<typeof schema>;

const format = async (data: {
    workbooks: WorkbookInstance[];
    nextPageToken?: string;
}): Promise<WorkbookInstancePage> => {
    return {
        workbooks: await workbookInstanceArray.format(data.workbooks),
        nextPageToken: data.nextPageToken,
    };
};

export const workbookInstancePage = {
    schema,
    format,
};
