import _ from 'lodash';

import {z} from '../../../components/zod';
import type {GetJoinedEntriesRevisionsByIdsResult} from '../../../services/new/entry';
import Utils from '../../../utils';

const NOT_FOUND_ERROR = 'NOT_FOUND';
const ACCESS_DENIED_ERROR = 'ACCESS_DENIED';

const schema = z.object({
    entryId: z.string(),
    error: z.object({
        code: z.enum([NOT_FOUND_ERROR, ACCESS_DENIED_ERROR]),
    }),
});

const format = ({
    accessDeniedEntryIds,
    entryId,
}: {
    accessDeniedEntryIds: GetJoinedEntriesRevisionsByIdsResult['accessDeniedEntryIds'];
    entryId: string;
}): z.infer<typeof schema> => {
    const errorCode = accessDeniedEntryIds.has(entryId) ? ACCESS_DENIED_ERROR : NOT_FOUND_ERROR;

    return {
        entryId: Utils.encodeId(entryId),
        error: {code: errorCode},
    };
};

export const entriesErrorModel = {
    schema,
    format,
};
