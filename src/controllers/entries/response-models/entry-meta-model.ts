import {z} from '../../../components/zod';
import {EntryScope} from '../../../db/models/new/entry/types';
import {JoinedEntryRevisionColumns} from '../../../db/presentations/joined-entry-revision';
import Utils from '../../../utils';

const schema = z
    .object({
        entryId: z.string(),
        scope: z.enum(EntryScope),
        type: z.string(),
        key: z.string().nullable(),
        meta: z.record(z.string(), z.unknown()).nullable(),
        annotation: z.record(z.string(), z.unknown()).nullable(),
        savedId: z.string().nullable(),
        publishedId: z.string().nullable(),
        tenantId: z.string().nullable(),
        workbookId: z.string().nullable(),
        collectionId: z.string().nullable(),
        supportDescription: z.string().optional(),
        accessDescription: z.string().optional(),
    })
    .describe('Entry meta model');

const format = (data: JoinedEntryRevisionColumns): z.infer<typeof schema> => {
    let supportDescription: string | undefined;
    let accessDescription: string | undefined;

    if (data.scope === 'dash' && data.data) {
        if (data.data.supportDescription) {
            supportDescription = data.data.supportDescription as string;
        }
        if (data.data.accessDescription) {
            accessDescription = data.data.accessDescription as string;
        }
    }

    return {
        entryId: Utils.encodeId(data.entryId),
        scope: data.scope,
        type: data.type,
        key: data.displayKey,
        meta: data.meta,
        annotation: data.annotation,
        savedId: data.savedId ? Utils.encodeId(data.savedId) : null,
        publishedId: data.publishedId ? Utils.encodeId(data.publishedId) : null,
        tenantId: data.tenantId,
        workbookId: data.workbookId ? Utils.encodeId(data.workbookId) : null,
        collectionId: data.collectionId ? Utils.encodeId(data.collectionId) : null,
        supportDescription,
        accessDescription,
    };
};

export const entryMetaModel = {
    schema,
    format,
};
