import {z} from '../../../components/zod';
import {CollectionModel} from '../../../db/models/new/collection';
import Utils from '../../../utils';

const schema = z
    .object({
        collectionId: z.string(),
        title: z.string(),
        description: z.string().optional().nullable(),
        parentId: z.string().nullable(),
        projectId: z.string().nullable(),
        tenantId: z.string(),
        createdBy: z.string(),
        createdAt: z.string(),
        updatedBy: z.string(),
        updatedAt: z.string(),
        meta: z.object({}),
    })
    .describe('Collection model');

const format = (data: CollectionModel): z.infer<typeof schema> => {
    return {
        collectionId: Utils.encodeId(data.collectionId),
        title: data.title,
        description: data.description,
        parentId: data.parentId ? Utils.encodeId(data.parentId) : null,
        projectId: data.projectId,
        tenantId: data.tenantId,
        createdBy: data.createdBy,
        createdAt: data.createdAt,
        updatedBy: data.updatedBy,
        updatedAt: data.updatedAt,
        meta: data.meta,
    };
};

export const collectionModel = {
    schema,
    format,
};
