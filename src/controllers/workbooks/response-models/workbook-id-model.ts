import {z} from '../../../components/zod';
import Utils from '../../../utils';

const schema = z
    .object({
        workbookId: z.string(),
    })
    .describe('Workbook id model');

export type WorkbookIdModel = z.infer<typeof schema>;

const format = (data: {workbookId: string}): WorkbookIdModel => {
    return {
        workbookId: Utils.encodeId(data.workbookId),
    };
};

export const workbookIdModel = {
    schema,
    format,
};
