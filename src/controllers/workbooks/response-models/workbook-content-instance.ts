import {z} from '../../../components/zod';
import {Entry} from '../../../db/models/new/entry';
import {EntryScope} from '../../../db/models/new/entry/types';
import {JoinedEntryRevisionColumns} from '../../../db/presentations';
import {UsPermission} from '../../../types/models';
import Utils from '../../../utils';

const schema = z
    .object({
        entries: z
            .object({
                entryId: z.string(),
                scope: z.nativeEnum(EntryScope),
                type: z.string(),
                key: z.string().nullable(),
                hidden: z.boolean(),
                isLocked: z.boolean(),
                isFavorite: z.boolean(),
                mirrored: z.boolean(),
                createdBy: z.string(),
                createdAt: z.string(),
                updatedBy: z.string(),
                updatedAt: z.string(),
                savedId: z.string().nullable(),
                publishedId: z.string().nullable(),
                workbookId: z.string().nullable(),
                meta: z.record(z.string(), z.unknown()).nullable(),
                permissions: z
                    .object({
                        execute: z.boolean().optional(),
                        read: z.boolean().optional(),
                        edit: z.boolean().optional(),
                        admin: z.boolean().optional(),
                    })
                    .optional(),
            })
            .array(),
        nextPageToken: z.string().optional(),
    })
    .describe('Workbook Content model');

export type WorkbookContentResponseInstance = z.infer<typeof schema>;

const format = ({
    entries,
    nextPageToken,
}: {
    entries: (Pick<Entry, 'isFavorite' | 'mirrored' | 'hidden'> &
        JoinedEntryRevisionColumns & {
            permissions: Optional<UsPermission>;
            isLocked: boolean;
        })[];
    nextPageToken?: string;
}): WorkbookContentResponseInstance => {
    return {
        entries: entries.map((data) => ({
            entryId: Utils.encodeId(data.entryId),
            scope: data.scope,
            type: data.type,
            key: data.displayKey,
            createdBy: data.createdBy,
            createdAt: data.createdAt,
            updatedBy: data.updatedBy,
            updatedAt: data.updatedAt,
            savedId: Utils.encodeId(data.savedId),
            publishedId: Utils.encodeId(data.publishedId),
            meta: data.meta,
            hidden: data.hidden,
            workbookId: Utils.encodeId(data.workbookId),
            isFavorite: data.isFavorite,
            isLocked: data.isLocked,
            permissions: data.permissions,
            mirrored: data.mirrored,
        })),
        nextPageToken,
    };
};

export const workbookContentInstance = {
    schema,
    format,
};
