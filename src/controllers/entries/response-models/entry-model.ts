import {z} from '../../../components/zod';
import {Entry} from '../../../db/models/new/entry';
import {EntryScope} from '../../../db/models/new/entry/types';
import Utils from '../../../utils';

const schema = z
    .object({
        entryId: z.string(),
        scope: z.enum(EntryScope),
        type: z.string(),
        key: z.string().nullable(),
        displayKey: z.string().nullable(),
        createdBy: z.string(),
        createdAt: z.string(),
        updatedBy: z.string(),
        updatedAt: z.string(),
        savedId: z.string().nullable(),
        publishedId: z.string().nullable(),
        tenantId: z.string().nullable(),
        workbookId: z.string().nullable(),
        unversionedData: z.record(z.string(), z.unknown()),
    })
    .describe('Entry model');

const format = (data: Entry): z.infer<typeof schema> => {
    return {
        entryId: Utils.encodeId(data.entryId),
        scope: data.scope,
        type: data.type,
        key: data.key,
        displayKey: data.displayKey,
        createdBy: data.createdBy,
        createdAt: data.createdAt,
        updatedBy: data.updatedBy,
        updatedAt: data.updatedAt,
        savedId: data.savedId ? Utils.encodeId(data.savedId) : null,
        publishedId: data.publishedId ? Utils.encodeId(data.publishedId) : null,
        tenantId: data.tenantId,
        workbookId: data.workbookId ? Utils.encodeId(data.workbookId) : null,
        unversionedData: data.unversionedData,
    };
};

export const entryModel = {
    schema,
    format,
};
