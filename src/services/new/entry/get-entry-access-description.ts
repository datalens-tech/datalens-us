import {NotExistEntryError} from '../../../components/errors';
import {Entry, EntryColumn} from '../../../db/models/new/entry';
import {JoinedEntryRevision} from '../../../db/presentations/joined-entry-revision';
import Utils from '../../../utils';
import {ServiceArgs} from '../types';

export type GetEntryAccessDescriptionArgs = {
    entryId: string;
    branch?: 'saved' | 'published';
};

export const getEntryAccessDescription = async (
    {ctx, mainTrx}: ServiceArgs<'mainTrx'>,
    args: GetEntryAccessDescriptionArgs,
) => {
    const {entryId, branch = 'saved'} = args;

    ctx.log('GET_ENTRY_ACCESS_DESCRIPTION_REQUEST', {
        entryId: Utils.encodeId(entryId),
    });

    const {tenantId} = ctx.get('info');

    const joinedEntryRevision = await JoinedEntryRevision.findOne({
        where: {
            [`${Entry.tableName}.${EntryColumn.EntryId}`]: entryId,
            [`${Entry.tableName}.${EntryColumn.IsDeleted}`]: false,
            [`${Entry.tableName}.${EntryColumn.TenantId}`]: tenantId,
        },
        joinRevisionArgs: {
            branch,
        },
        trx: mainTrx ?? JoinedEntryRevision.replica,
    });

    if (!joinedEntryRevision) {
        throw new NotExistEntryError();
    }

    ctx.log('GET_ENTRY_ACCESS_DESCRIPTION_SUCCESS');

    return joinedEntryRevision;
};
