import {z} from '../../../components/zod';
import type {WorkbookInstance} from '../../../registry/common/entities/workbook/types';

import {workbookInstance as originalWorkbookInstance} from './workbook-instance';

const schema = originalWorkbookInstance.schema.array().describe('Workbook model array');

export type WorkbookArrayResponseModel = z.infer<typeof schema>;

const format = (workbooks: WorkbookInstance[]): WorkbookArrayResponseModel => {
    return workbooks.map(originalWorkbookInstance.format);
};

export const WorkbookModelArray = {
    schema,
    format,
};
