import {z} from '../../../components/zod';
import {WorkbookModel} from '../../../db/models/new/workbook';

import {workbookModel as originalWorkbookModel} from './workbook-model';

const schema = originalWorkbookModel.schema.array().describe('Workbook model array');

export type WorkbookArrayResponseModel = z.infer<typeof schema>;

const format = (workbooks: WorkbookModel[]): WorkbookArrayResponseModel => {
    return workbooks.map(originalWorkbookModel.format);
};

export const WorkbookModelArray = {
    schema,
    format,
};
