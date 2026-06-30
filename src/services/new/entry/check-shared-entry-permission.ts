import {Entry as EntryModel} from '../../../db/models/new/entry';
import {SharedEntryPermission} from '../../../entities/shared-entry';
import {getParentIds} from '../collection/utils/get-parents';
import {ServiceArgs} from '../types';

export const checkSharedEntryPermission = async (
    {ctx, trx}: ServiceArgs,
    {
        entry,
        permission = SharedEntryPermission.LimitedView,
    }: {entry: EntryModel; permission?: SharedEntryPermission},
): Promise<void> => {
    const {accessServiceEnabled} = ctx.config;
    const {isPrivateRoute} = ctx.get('info');

    if (!accessServiceEnabled || isPrivateRoute) {
        return;
    }

    const {SharedEntry} = ctx.get('registry').common.classes.get();
    const sharedEntry = new SharedEntry({ctx, model: entry});
    const parentIds = await getParentIds({ctx, trx, collectionId: entry.collectionId as string});

    await sharedEntry.checkPermission({parentIds, permission});
};
