import {z} from '../../../components/zod';
import type {EntryRevisionNavItem, GetEntryRevisionsResult} from '../../../services/entry';
import Utils from '../../../utils';

import {navigationEntryModel} from './navigation-entry-model';

const revisionItemSchema = z
    .object({
        ...navigationEntryModel.schema.shape,
        revId: z.string(),
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
        ...navigationEntryModel.format(item),
        revId: Utils.encodeId(item.revId),
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
