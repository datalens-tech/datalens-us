import {z} from '../../../components/zod';
import type {WorkbookInstance} from '../../../registry/plugins/common/entities/workbook/types';
import Utils from '../../../utils';

import {workbookInstance} from './workbook-instance';

const schema = workbookInstance.schema.array().describe('Workbook instance array');

export type WorkbookInstanceArray = z.infer<typeof schema>;

const format = async (data: {
    workbooks: WorkbookInstance[];
    includePermissionsInfo?: boolean;
}): Promise<WorkbookInstanceArray> => {
    const {workbooks, includePermissionsInfo} = data;
    return Utils.macrotasksMap(workbooks, (workbook) =>
        workbookInstance.format({workbook, includePermissionsInfo}),
    );
};

export const workbookInstanceArray = {
    schema,
    format,
};
