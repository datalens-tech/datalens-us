import {z} from '../../../components/zod';
import type {WorkbookInstance} from '../../../registry/common/entities/workbook/types';
import Utils from '../../../utils';

import {workbookInstance} from './workbook-instance';

const schema = workbookInstance.schema.array().describe('Workbook instance array');

export type WorkbookInstanceArray = z.infer<typeof schema>;

const format = async (data: WorkbookInstance[]): Promise<WorkbookInstanceArray> => {
    return Utils.macrotasksMap(data, workbookInstance.format);
};

export const workbookInstanceArray = {
    schema,
    format,
};
