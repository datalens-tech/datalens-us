import {z} from '../../../components/zod';
import {EntryScope} from '../../../db/models/new/entry/types';
import {ReturnMetaColumnsEntry} from '../../../services/entry/types';
import Utils from '../../../utils';

const schema = z.object({
    entryId: z.string(),
    scope: z.enum(EntryScope),
    type: z.string(),
    key: z.string().nullable(),
    meta: z.record(z.string(), z.unknown()).nullable(),
    savedId: z.string().nullable(),
    publishedId: z.string().nullable(),
    tenantId: z.string().nullable(),
    workbookId: z.string().nullable(),
    collectionId: z.string().nullable(),
});

const format = (data: ReturnMetaColumnsEntry): z.infer<typeof schema> => ({
    entryId: Utils.encodeId(data.entryId),
    scope: data.scope,
    type: data.type,
    key: data.key,
    meta: data.meta,
    savedId: Utils.encodeIdOrNull(data.savedId),
    publishedId: Utils.encodeIdOrNull(data.publishedId),
    tenantId: data.tenantId,
    workbookId: Utils.encodeIdOrNull(data.workbookId),
    collectionId: Utils.encodeIdOrNull(data.collectionId),
});

export const entryMetaColumnsModel = {schema, format};
