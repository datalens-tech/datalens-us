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
        createdBy: z.string(),
        createdAt: z.string(),
        updatedBy: z.string(),
        updatedAt: z.string(),
        savedId: z.string().nullable(),
        publishedId: z.string().nullable(),
        tenantId: z.string().nullable(),
        workbookId: z.string().nullable(),
        public: z.boolean(),
    })
    .describe('Copy entry to workbook model');

const format = (data: Entry): z.infer<typeof schema> => ({
    entryId: Utils.encodeId(data.entryId),
    scope: data.scope,
    type: data.type,
    key: data.displayKey,
    createdBy: data.createdBy,
    createdAt: data.createdAt,
    updatedBy: data.updatedBy,
    updatedAt: data.updatedAt,
    savedId: Utils.encodeIdOrNull(data.savedId),
    publishedId: Utils.encodeIdOrNull(data.publishedId),
    tenantId: data.tenantId,
    workbookId: Utils.encodeIdOrNull(data.workbookId),
    public: data.public,
});

export const copyEntryToWorkbookModel = {schema, format};
