import {DEFAULT_QUERY_TIMEOUT} from '../../../const';
import Entry from '../../../db/models/entry';
import {ServiceArgs} from '../../new/types';

const selectedColumns = ['entryId', 'scope', 'display_key as key', 'type'];

type GetEntriesByKeyPatternArgs = {
    keyPattern: string;
};

export async function getEntriesByKeyPattern({ctx}: ServiceArgs, args: GetEntriesByKeyPatternArgs) {
    const {keyPattern} = args;

    ctx.log('ENTRIES_BY_KEY_PATTERN_CALL', {keyPattern});

    const {tenantId} = ctx.get('info');

    const entries = await Entry.query(Entry.replica)
        .select(selectedColumns)
        .where({tenantId})
        .andWhere('key', 'like', keyPattern.toLowerCase())
        .timeout(DEFAULT_QUERY_TIMEOUT);

    ctx.log('ENTRIES_BY_KEY_PATTERN_SUCCESS');

    return entries;
}
