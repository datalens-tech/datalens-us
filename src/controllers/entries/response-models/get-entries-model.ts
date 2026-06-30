import {filterUnversionedData} from '../../../components/private-permissions';
import {z} from '../../../components/zod';
import {EntryScope} from '../../../db/models/new/entry/types';
import {
    FullNavigationEntry,
    GetEntriesResult,
    LockedNavigationEntry,
} from '../../../services/navigation.service';
import {PrivatePermissions} from '../../../types/models';
import Utils from '../../../utils';

import {navigationEntryModel} from './navigation-entry-model';

const lockedEntrySchema = z.object({
    entryId: z.string(),
    scope: z.enum(EntryScope),
    type: z.string(),
    isLocked: z.literal(true),
});

const fullEntrySchema = z.object({
    ...navigationEntryModel.schema.shape,
    isLocked: z.literal(false),
    workbookTitle: z.string().nullable().optional(),
    collectionTitle: z.string().nullable().optional(),
    isFavorite: z.boolean().optional(),
    unversionedData: z.record(z.string(), z.unknown()).nullish(),
    data: z.record(z.string(), z.unknown()).nullable().optional(),
    links: z.record(z.string(), z.unknown()).nullable().optional(),
    permissions: z.record(z.string(), z.boolean()).optional(),
});

const entryItemSchema = z.union([lockedEntrySchema, fullEntrySchema]);

const schema = z
    .object({
        entries: entryItemSchema.array(),
        nextPageToken: z.string().optional(),
    })
    .describe('Get entries model');

const formatLockedEntry = (entry: LockedNavigationEntry): z.infer<typeof lockedEntrySchema> => ({
    entryId: Utils.encodeId(entry.entryId),
    scope: entry.scope as EntryScope,
    type: entry.type,
    isLocked: true,
});

const formatFullEntry = (
    entry: FullNavigationEntry,
    privatePermissions: PrivatePermissions,
): z.infer<typeof fullEntrySchema> => ({
    ...navigationEntryModel.format(entry),
    isLocked: false,
    workbookTitle: entry.workbookTitle,
    collectionTitle: entry.collectionTitle,
    isFavorite: entry.isFavorite,
    unversionedData: filterUnversionedData(entry.scope, entry.unversionedData, privatePermissions),
    data: entry.data,
    links: entry.links,
    permissions: entry.permissions,
});

const format = async (
    data: GetEntriesResult,
    privatePermissions: PrivatePermissions,
): Promise<z.infer<typeof schema>> => ({
    entries: await Utils.macrotasksMap(data.entries, (entry) =>
        entry.isLocked ? formatLockedEntry(entry) : formatFullEntry(entry, privatePermissions),
    ),
    nextPageToken: data.nextPageToken,
});

export const getEntriesModel = {schema, format};
