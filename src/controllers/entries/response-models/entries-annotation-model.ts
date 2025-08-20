import {z} from '../../../components/zod';
import {EntryScope} from '../../../db/models/new/entry/types';
import {RevisionAnnotationFields} from '../../../db/models/new/revision';
import type {GetJoinedEntriesRevisionsByIdsResult} from '../../../services/new/entry';
import Utils from '../../../utils';

import {entriesErrorModel} from './entries-error-model';

const schema = z
    .object({
        entryId: z.string(),
        result: z.object({
            scope: z.nativeEnum(EntryScope),
            type: z.string(),
            annotation: z.object({
                [RevisionAnnotationFields.Description]: z.string().optional(),
            }),
        }),
    })
    .or(entriesErrorModel.schema)
    .array()
    .describe('Entries annotation model');

type FormatParams = {
    result: GetJoinedEntriesRevisionsByIdsResult;
    entryIds: string[];
};

const format = ({result, entryIds}: FormatParams): z.infer<typeof schema> => {
    const {entries, accessDeniedEntryIds} = result;

    return entryIds.map((entryId) => {
        const entry = entries[entryId];

        if (entry) {
            return {
                entryId: Utils.encodeId(entryId),
                result: {
                    scope: entry.scope,
                    type: entry.type,
                    annotation: entry.annotation ?? {},
                },
            };
        }

        return entriesErrorModel.format({accessDeniedEntryIds, entryId});
    });
};

export const entriesAnnotationModel = {
    schema,
    format,
};
