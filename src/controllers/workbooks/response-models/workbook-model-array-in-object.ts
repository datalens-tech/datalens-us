import {z} from '../../../components/zod';
import {WorkbookModel} from '../../../db/models/new/workbook';
import Utils from '../../../utils';

import {workbookModel} from './workbook-model';

const schema = z
    .object({
        workbooks: workbookModel.schema.array(),
    })
    .describe('Workbook model array in object');

export type WorkbookModelArrayInObjectResponseModel = z.infer<typeof schema>;

const format = async (data: {
    workbooks: WorkbookModel[];
}): Promise<WorkbookModelArrayInObjectResponseModel> => {
    return {
        workbooks: await Utils.macrotasksMap(data.workbooks, workbookModel.format),
    };
};

export const workbookModelArrayInObject = {
    schema,
    format,
};
