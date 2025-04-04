import {z} from '../../../components/zod';
import {WorkbookModel} from '../../../db/models/new/workbook';
import {WorkbookStatus} from '../../../db/models/new/workbook/types';
import Utils from '../../../utils';

const schema = z
    .object({
        workbookId: z.string(),
        collectionId: z.string().nullable(),
        title: z.string(),
        description: z.string().nullable(),
        tenantId: z.string(),
        meta: z.object({}),
        createdBy: z.string(),
        createdAt: z.string(),
        updatedBy: z.string().nullable(),
        updatedAt: z.string(),
        status: z.nativeEnum(WorkbookStatus),
    })
    .describe('Workbook model');

export type WorkbookResponseModel = z.infer<typeof schema>;

const format = (data: WorkbookModel): WorkbookResponseModel => {
    return {
        workbookId: Utils.encodeId(data.workbookId),
        collectionId: data.collectionId ? Utils.encodeId(data.collectionId) : null,
        title: data.title,
        description: data.description,
        tenantId: data.tenantId,
        meta: data.meta,
        createdBy: data.createdBy,
        createdAt: data.createdAt,
        updatedBy: data.updatedBy,
        updatedAt: data.updatedAt,
        status: data.status,
    };
};

export const workbookModel = {
    schema,
    format,
};
