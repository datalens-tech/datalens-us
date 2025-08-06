import {z} from '../../../components/zod';
import type {GetJoinedEntriesRevisionsByIdsResult} from '../../../services/new/entry';

import {entryBulkModel} from './entry-bulk-model';

const schema = entryBulkModel.schema.array().describe('Entries meta model');

const format = ({
    result,
    entryIds,
    fields,
}: {
    result: GetJoinedEntriesRevisionsByIdsResult;
    entryIds: string[];
    fields: string[];
}): z.infer<typeof schema> =>
    entryIds.map((entryId) => entryBulkModel.format({entryId, result, fields, entryKey: 'meta'}));

export const entriesMetaModel = {
    schema,
    format,
};
