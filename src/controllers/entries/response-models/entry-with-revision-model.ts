import {z} from '../../../components/zod';
import {EntryScope} from '../../../db/models/new/entry/types';
import {JoinedEntryRevisionColumns} from '../../../db/presentations/joined-entry-revision';
import Utils from '../../../utils';

const schema = z
    .object({
        entryId: z.string(),
        scope: z.nativeEnum(EntryScope),
        type: z.string(),
        key: z.string().nullable(),
        displayKey: z.string().nullable(),
        createdBy: z.string(),
        createdAt: z.string(),
        updatedBy: z.string(),
        updatedAt: z.string(),
        savedId: z.string().nullable(),
        publishedId: z.string().nullable(),
        revId: z.string(),
        tenantId: z.string().nullable(),
        workbookId: z.string().nullable(),
        data: z.record(z.string(), z.unknown()).nullable(),
        meta: z.record(z.string(), z.unknown()).nullable(),
        links: z.record(z.string(), z.unknown()).nullable(),
    })
    .describe('Entry with revision model');

const format = (data: JoinedEntryRevisionColumns): z.infer<typeof schema> => {
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
        revId: Utils.encodeId(data.revId),
        tenantId: data.tenantId,
        workbookId: data.workbookId ? Utils.encodeId(data.workbookId) : null,
        data: data.data,
        meta: data.meta,
        links: data.links,
    };
};

export const entryWithRevisionModel = {
    schema,
    format,
};
