import {z} from '../../../components/zod';
import {JoinedEntryRevisionFavoriteColumns} from '../../../db/presentations/joined-entry-revision-favorite';
import {EntryPermissions} from '../../../services/new/entry/types';
import Utils from '../../../utils';

import {workbookContentEntryModel} from './workbook-content-entry-model';

const schema = z
    .object({
        entries: workbookContentEntryModel.schema.array(),
        nextPageToken: z.string().optional(),
    })
    .describe('Workbook content model');

export type WorkbookContentModel = z.infer<typeof schema>;

const format = async (data: {
    entries: (JoinedEntryRevisionFavoriteColumns & {
        isLocked: boolean;
        permissions?: EntryPermissions;
    })[];
    nextPageToken?: string;
}): Promise<WorkbookContentModel> => {
    return {
        entries: await Utils.macrotasksMap(data.entries, workbookContentEntryModel.format),
        nextPageToken: data.nextPageToken,
    };
};

export const workbookContentModel = {
    schema,
    format,
};
