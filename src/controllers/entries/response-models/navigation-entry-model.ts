import {z} from '../../../components/zod';
import {EntryScope} from '../../../db/models/new/entry/types';
import {ReturnNavigationColumnsEntry} from '../../../services/entry/types';
import Utils from '../../../utils';

const schema = z.object({
    entryId: z.string(),
    scope: z.enum(EntryScope),
    type: z.string(),
    key: z.string().nullable(),
    meta: z.record(z.string(), z.unknown()).nullable(),
    createdBy: z.string(),
    createdAt: z.string(),
    updatedBy: z.string(),
    updatedAt: z.string(),
    annotation: z.record(z.string(), z.unknown()).nullable(),
    savedId: z.string().nullable(),
    publishedId: z.string().nullable(),
    hidden: z.boolean(),
    workbookId: z.string().nullable(),
    collectionId: z.string().nullable(),
});

const format = (entry: ReturnNavigationColumnsEntry): z.infer<typeof schema> => ({
    entryId: Utils.encodeId(entry.entryId),
    scope: entry.scope as EntryScope,
    type: entry.type,
    key: entry.key,
    meta: entry.meta,
    createdBy: entry.createdBy,
    createdAt: entry.createdAt,
    updatedBy: entry.updatedBy,
    updatedAt: entry.updatedAt,
    annotation: entry.annotation,
    savedId: Utils.encodeIdOrNull(entry.savedId),
    publishedId: Utils.encodeIdOrNull(entry.publishedId),
    hidden: entry.hidden,
    workbookId: Utils.encodeIdOrNull(entry.workbookId),
    collectionId: Utils.encodeIdOrNull(entry.collectionId),
});

export const navigationEntryModel = {schema, format};
