import {CTX} from '../../../../types/models';
import * as MT from '../../../../types/models';

export const formatGetEntriesResponse = (ctx: CTX, result: MT.PaginationEntriesResponse) => {
    const {privatePermissions} = ctx.get('info');

    const processedEntries = result.entries.map((entry) => {
        if (entry.scope && !privatePermissions.ownedScopes.includes(entry.scope)) {
            return {
                ...entry,
                unversionedData: undefined,
            };
        }
        return entry;
    });

    return {
        ...result,
        entries: processedEntries,
    };
};
