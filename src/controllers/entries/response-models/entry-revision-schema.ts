import {z} from '../../../components/zod';
import {EntryScope} from '../../../db/models/new/entry/types';
import {EntryWithRevisionResult} from '../../../services/entry/types';
import Utils from '../../../utils';

const schema = z.object({
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
    revId: z.string(),
    tenantId: z.string().nullable(),
    data: z.record(z.string(), z.unknown()).nullable(),
    meta: z.record(z.string(), z.unknown()).nullable(),
    annotation: z.record(z.string(), z.unknown()).nullable(),
    hidden: z.boolean(),
    mirrored: z.boolean(),
    public: z.boolean(),
    workbookId: z.string().nullable(),
    collectionId: z.string().nullable(),
    version: z.number().nullable(),
    sourceVersion: z.number().nullable(),
    links: z.record(z.string(), z.unknown()).nullable().optional(),
});

const format = (data: EntryWithRevisionResult): z.infer<typeof schema> => ({
    entryId: Utils.encodeId(data.entryId),
    scope: data.scope as EntryScope,
    type: data.type,
    key: data.key,
    createdBy: data.createdBy,
    createdAt: data.createdAt,
    updatedBy: data.updatedBy,
    updatedAt: data.updatedAt,
    savedId: Utils.encodeIdOrNull(data.savedId),
    publishedId: Utils.encodeIdOrNull(data.publishedId),
    revId: Utils.encodeId(data.revId),
    tenantId: data.tenantId,
    data: data.data,
    meta: data.meta,
    annotation: data.annotation as Record<string, unknown> | null,
    hidden: data.hidden,
    mirrored: data.mirrored,
    public: data.public,
    workbookId: Utils.encodeIdOrNull(data.workbookId),
    collectionId: Utils.encodeIdOrNull(data.collectionId),
    version: data.version,
    sourceVersion: data.sourceVersion,
});

export const entryRevisionModel = {schema, format};
