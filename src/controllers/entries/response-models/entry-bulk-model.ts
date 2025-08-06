import _ from 'lodash';

import {z, zc} from '../../../components/zod';
import {US_ERRORS} from '../../../const';
import {EntryScope} from '../../../db/models/new/entry/types';
import type {GetJoinedEntriesRevisionsByIdsResult} from '../../../services/new/entry';
import Utils from '../../../utils';

const dataSchema = z.object({
    scope: z.nativeEnum(EntryScope),
    type: z.string(),
    data: z.record(z.string(), z.unknown()),
});

const metaSchema = z.object({
    scope: z.nativeEnum(EntryScope),
    type: z.string(),
    meta: z.record(z.string(), z.unknown()),
});

const resultSchema = z.object({
    result: dataSchema.or(metaSchema),
});

const errorSchema = z.object({
    error: z.object({
        code: z.enum([US_ERRORS.NOT_FOUND, US_ERRORS.ACCESS_DENIED]),
    }),
});

const schema = z
    .object({
        entryId: zc.encodedId(),
    })
    .and(resultSchema.or(errorSchema))
    .describe('Entry bulk model');

type FormatParams = {
    entryId: string;
    result: GetJoinedEntriesRevisionsByIdsResult;
    fields: string[];
    entryKey: 'data' | 'meta';
};

const format = ({entryId, result, fields, entryKey}: FormatParams): z.infer<typeof schema> => {
    const entry = result.entries[entryId];
    const encodedEntryId = Utils.encodeId(entryId);

    if (!entry) {
        const code = result.accessDeniedEntryIds.has(entryId)
            ? US_ERRORS.ACCESS_DENIED
            : US_ERRORS.NOT_FOUND;
        return {entryId: encodedEntryId, error: {code}};
    }

    const filteredEntryFields = entry[entryKey]
        ? fields.reduce<Record<string, unknown>>((acc, fieldPath) => {
              acc[fieldPath] = _.get(entry[entryKey], fieldPath);
              return acc;
          }, {})
        : {};

    return {
        entryId: encodedEntryId,
        result: {
            scope: entry.scope,
            type: entry.type,
            ...(entryKey === 'data' ? {data: filteredEntryFields} : {meta: filteredEntryFields}),
        },
    };
};

export const entryBulkModel = {
    schema,
    format,
};
