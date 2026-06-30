import {Entry as EntryModel} from '../../../db/models/new/entry';
import type {SharedEntryInstance} from '../../../registry/plugins/common/entities/shared-entry/types';
import {makeCollectionEntriesWithParentsMap} from '../collection/utils/get-parents';
import {ServiceArgs} from '../types';

export const getSharedEntriesWithPermissions = async (
    {ctx, trx}: ServiceArgs,
    {entries}: {entries: EntryModel[]},
): Promise<SharedEntryInstance[]> => {
    if (entries.length === 0) {
        return [];
    }

    const {SharedEntry} = ctx.get('registry').common.classes.get();
    const {isPrivateRoute} = ctx.get('info');
    const {accessServiceEnabled} = ctx.config;

    if (isPrivateRoute || !accessServiceEnabled) {
        return entries.map((model) => {
            const sharedEntry = new SharedEntry({ctx, model});
            sharedEntry.enableAllPermissions();
            return sharedEntry;
        });
    }

    const entriesWithParentsMap = await makeCollectionEntriesWithParentsMap(
        {ctx, trx},
        {models: entries},
    );
    const items = [...entriesWithParentsMap].map(([model, parentIds]) => ({model, parentIds}));

    return SharedEntry.bulkFetchAllPermissions(ctx, items);
};
