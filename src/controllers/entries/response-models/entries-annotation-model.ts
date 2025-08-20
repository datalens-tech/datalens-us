import {z} from '../../../components/zod';
import {ANNOTATION_DESCRIPTION_MAX_LENGTH} from '../../../const';
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
                [RevisionAnnotationFields.Description]: z
                    .string()
                    .max(ANNOTATION_DESCRIPTION_MAX_LENGTH)
                    .optional(),
            }),
        }),
    })
    .or(entriesErrorModel.schema)
    .array()
    .describe('Entries annotation model');

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
            const filteredFields = entry.annotation
                ? Object.fromEntries(
                      fields.map((path) => [
                          path,
                          path === RevisionAnnotationFields.Description
                              ? entry?.annotation?.[path]
                              : undefined,
                      ]),
                  )
                : {};

            return {
                entryId: Utils.encodeId(entryId),
                result: {
                    scope: entry.scope,
                    type: entry.type,
                    annotation: filteredFields,
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
