import _ from 'lodash';

import {z, zc} from '../../../components/zod';
import {EntryScope} from '../../../db/models/new/entry/types';
import type {GetJoinedEntriesRevisionsByIdsResult} from '../../../services/new/entry';
import Utils from '../../../utils';

const NOT_FOUND_ERROR_CODE = 'NOT_FOUND';
const ACCESS_DENIED_ERROR_CODE = 'ACCESS_DENIED';

const errorSchema = z.object({
    error: z.object({
        code: z.enum([NOT_FOUND_ERROR_CODE, ACCESS_DENIED_ERROR_CODE]),
    }),
});

const resultSchema = z.object({
    result: z.object({
        scope: z.nativeEnum(EntryScope),
        type: z.string(),
        data: z.record(z.unknown()),
    }),
});

const schema = z
    .object({
        entryId: zc.encodedId(),
    })
    .and(z.union([resultSchema, errorSchema]))
    .array()
    .describe('Entries data');

type ResponseItemResult = z.infer<typeof resultSchema>['result'];

export type GetEntriesDataResponseBody = z.infer<typeof schema>;

const format = ({
    result,
    entryIds,
    fields,
}: {
    result: GetJoinedEntriesRevisionsByIdsResult;
    entryIds: string[];
    fields: string[];
}): GetEntriesDataResponseBody => {
    const {entries, accessDeniedEntryIds} = result;

    const formattedResult: GetEntriesDataResponseBody = [];

    entryIds.forEach((entryId) => {
        const entry = entries[entryId];
        const encodedEntryId = Utils.encodeId(entryId);

        if (entry) {
            let responseData: ResponseItemResult['data'];
            const {data, scope, type} = entry;

            if (data) {
                responseData = fields.reduce<ResponseItemResult['data']>((acc, fieldPath) => {
                    acc[fieldPath] = _.get(data, fieldPath);

                    return acc;
                }, {});
            } else {
                responseData = {};
            }

            formattedResult.push({
                entryId: encodedEntryId,
                result: {
                    scope,
                    type,
                    data: responseData,
                },
            });
        } else if (accessDeniedEntryIds.includes(entryId)) {
            formattedResult.push({
                entryId: encodedEntryId,
                error: {code: ACCESS_DENIED_ERROR_CODE},
            });
        } else {
            formattedResult.push({
                entryId: encodedEntryId,
                error: {code: NOT_FOUND_ERROR_CODE},
            });
        }
    });

    return formattedResult;
};

export const entriesDataModel = {
    schema,
    format,
};
