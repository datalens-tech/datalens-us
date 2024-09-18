import Entry from '../../../db/models/entry';
import {DEFAULT_QUERY_TIMEOUT} from '../../../const';
import {makeSchemaValidator} from '../../../components/validation-schema-compiler';
import {ServiceArgs} from '../../new/types';

const validateArgs = makeSchemaValidator({
    type: 'object',
    required: ['keyPattern'],
    properties: {
        keyPattern: {
            type: 'string',
        },
    },
});

const selectedColumns = ['entryId', 'scope', 'display_key as key', 'type'];

type GetEntriesByKeyPatternArgs = {
    keyPattern: string;
};

export async function getEntriesByKeyPattern(
    {ctx, skipValidation = false}: ServiceArgs,
    args: GetEntriesByKeyPatternArgs,
) {
    const {keyPattern} = args;

    ctx.log('ENTRIES_BY_KEY_PATTERN_CALL', {keyPattern});

    if (!skipValidation) {
        validateArgs(args);
    }

    const {tenantId} = ctx.get('info');

    const entries = await Entry.query(Entry.replica)
        .select(selectedColumns)
        .where({tenantId})
        .andWhere('key', 'like', keyPattern.toLowerCase())
        .timeout(DEFAULT_QUERY_TIMEOUT);

    ctx.log('ENTRIES_BY_KEY_PATTERN_SUCCESS');

    return entries;
}
