import {z} from '../../../components/zod';
import {EntryScope} from '../../../db/models/new/entry/types';
import type {GetJoinedEntriesRevisionsByIdsResult} from '../../../services/new/entry';
import Utils from '../../../utils';

import {entriesErrorModel} from './entries-error-model';

const schema = z
    .object({
        entryId: z.string(),
        result: z.object({
            scope: z.nativeEnum(EntryScope),
            type: z.string(),
            meta: z.record(z.string(), z.unknown()),
        }),
    })
    .or(entriesErrorModel.schema)
    .array()
    .describe('Entries meta model');

type FormatParams = {
    result: GetJoinedEntriesRevisionsByIdsResult;
    entryIds: string[];
    fields: string[];
};

const format = ({result, entryIds, fields}: FormatParams): z.infer<typeof schema> => {
    const {entries, accessDeniedEntryIds} = result;

    return entryIds.map((entryId) => {
        const entry = entries[entryId];

        if (entry) {
            const filteredFields = entry.meta
                ? Object.fromEntries(fields.map((path) => [path, entry.meta?.[path]]))
                : {};

            return {
                entryId: Utils.encodeId(entryId),
                result: {
                    scope: entry.scope,
                    type: entry.type,
                    meta: filteredFields,
                },
            };
        }

        return entriesErrorModel.format({accessDeniedEntryIds, entryId});
    });
};

export const entriesMetaModel = {
    schema,
    format,
};
