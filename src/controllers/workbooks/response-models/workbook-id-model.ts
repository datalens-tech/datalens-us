import {z} from '../../../components/zod';
import Utils from '../../../utils';

const schema = z
    .object({
        workbookId: z.string(),
    })
    .describe('Workbook id');

export type WorkbookIdResponseModel = z.infer<typeof schema>;

const format = (data: {workbookId: string}): WorkbookIdResponseModel => {
    return {
        workbookId: Utils.encodeId(data.workbookId),
    };
};

export const WorkbookIdModel = {
    schema,
    format,
};
