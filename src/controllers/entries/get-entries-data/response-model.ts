import _ from 'lodash';

import {z, zc} from '../../../components/zod';
import {EntryScope} from '../../../db/models/new/entry/types';
import type {GetJoinedEntriesRevisionsByIdsResult} from '../../../services/new/entry';
import Utils from '../../../utils';

import {ACCESS_DENIED_ERROR_CODE, NOT_FOUND_ERROR_CODE} from './constants';

const errorSchema = z.object({
    error: z.object({
        code: z.enum([NOT_FOUND_ERROR_CODE, ACCESS_DENIED_ERROR_CODE]),
    }),
});

const resultSchema = z.object({
    result: z.object({
        scope: z.nativeEnum(EntryScope).nullable(),
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
    fields,
}: {
    result: GetJoinedEntriesRevisionsByIdsResult;
    fields: string[];
}): GetEntriesDataResponseBody => {
    const {entries, notFoundEntryIds, accessDeniedEntryIds} = result;

    const formattedResult: GetEntriesDataResponseBody = [];

    entries.forEach(({entryId, scope, type, data}) => {
        let responseData: ResponseItemResult['data'];

        if (data) {
            responseData = fields.reduce<ResponseItemResult['data']>((acc, fieldPath) => {
                acc[fieldPath] = _.get(data, fieldPath);

                return acc;
            }, {});
        } else {
            responseData = {};
        }

        formattedResult.push({
            entryId: Utils.encodeId(entryId),
            result: {
                scope,
                type,
                data: responseData,
            },
        });
    });

    notFoundEntryIds.forEach((entryId) => {
        formattedResult.push({
            entryId: Utils.encodeId(entryId),
            error: {code: NOT_FOUND_ERROR_CODE},
        });
    });

    accessDeniedEntryIds.forEach((entryId) => {
        formattedResult.push({
            entryId: Utils.encodeId(entryId),
            error: {code: ACCESS_DENIED_ERROR_CODE},
        });
    });

    return formattedResult;
};

export const entriesData = {
    schema,
    format,
};
