import {z} from '../../../components/zod';
import {EntryScope} from '../../../db/models/new/entry/types';
import type {EntryRevisionNavItem, GetEntryRevisionsResult} from '../../../services/entry';
import Utils from '../../../utils';

const revisionItemSchema = z
    .object({
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
        revId: z.string(),
        hidden: z.boolean(),
        workbookId: z.string().nullable(),
        collectionId: z.string().nullable(),
    })
    .describe('Entry revision navigation item');

const schema = z
    .object({
        nextPageToken: z.string().optional(),
        entries: z.array(revisionItemSchema),
    })
    .describe('Entry revisions list');

const formatItem = (item: EntryRevisionNavItem): z.infer<typeof revisionItemSchema> => {
    return {
        entryId: Utils.encodeId(item.entryId),
        scope: item.scope,
        type: item.type,
        key: item.key,
        meta: item.meta,
        createdBy: item.createdBy,
        createdAt: item.createdAt,
        updatedBy: item.updatedBy,
        updatedAt: item.updatedAt,
        annotation: item.annotation,
        savedId: item.savedId ? Utils.encodeId(item.savedId) : null,
        publishedId: item.publishedId ? Utils.encodeId(item.publishedId) : null,
        revId: Utils.encodeId(item.revId),
        hidden: item.hidden,
        workbookId: item.workbookId ? Utils.encodeId(item.workbookId) : null,
        collectionId: item.collectionId ? Utils.encodeId(item.collectionId) : null,
    };
};

const format = async ({
    nextPageToken,
    entries,
}: GetEntryRevisionsResult): Promise<z.infer<typeof schema>> => {
    return {
        nextPageToken,
        entries: await Utils.macrotasksMap(entries, formatItem),
    };
};

export const entryRevisionsPageModel = {
    schema,
    format,
};
