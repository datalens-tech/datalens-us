import {z} from '../../../components/zod';
import {WorkbookModel} from '../../../db/models/new/workbook';
import Utils from '../../../utils';

import {workbookModel} from './workbook-model';

const schema = workbookModel.schema.array().describe('Workbook model array');

export type WorkbookModelArray = z.infer<typeof schema>;

const format = async (data: WorkbookModel[]): Promise<WorkbookModelArray> => {
    return Utils.macrotasksMap(data, workbookModel.format);
};

export const workbookModelArray = {
    schema,
    format,
};
