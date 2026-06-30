import {NotExistEntryError} from '../../../components/errors';
import {Entry} from '../../../db/models/new/entry';
import {JoinedEntryRevision} from '../../../db/presentations/joined-entry-revision';
import {DlsActions} from '../../../types/models';
import Utils from '../../../utils';
import {ServiceArgs} from '../types';
import {getReplica} from '../utils';
import {getWorkbook} from '../workbook';

import {CollectionEntryPermissions, resolveCollectionEntryPermissions} from './collection-entry';
import {checkFetchedEntry} from './utils';

export type GetEntryMetaArgs = {
    entryId: string;
    branch?: 'saved' | 'published';
};

export const getEntryMeta = async ({ctx, trx}: ServiceArgs, args: GetEntryMetaArgs) => {
    const {entryId, branch = 'saved'} = args;

    ctx.log('GET_ENTRY_META_REQUEST', {
        entryId: Utils.encodeId(entryId),
    });

    const registry = ctx.get('registry');
    const {DLS} = registry.common.classes.get();

    const {isPrivateRoute} = ctx.get('info');

    const joinedEntryRevision = await JoinedEntryRevision.findOne({
        where: {
            [`${Entry.tableName}.entryId`]: entryId,
            [`${Entry.tableName}.isDeleted`]: false,
        },
        joinRevisionArgs: {
            branch,
        },
        trx: getReplica(trx),
    });

    if (joinedEntryRevision) {
        if (!isPrivateRoute && !joinedEntryRevision.workbookId) {
            await checkFetchedEntry(ctx, joinedEntryRevision, getReplica(trx));
        }

        if (joinedEntryRevision.workbookId) {
            if (!isPrivateRoute) {
                await getWorkbook({ctx, trx}, {workbookId: joinedEntryRevision.workbookId});
            }
        } else if (joinedEntryRevision.collectionId) {
            await resolveCollectionEntryPermissions(
                {ctx, trx: getReplica(trx)},
                {
                    entry: joinedEntryRevision as unknown as Entry,
                    permission: CollectionEntryPermissions.Read,
                    includePermissions: false,
                    skipCheckPermissions: isPrivateRoute,
                },
            );
        } else {
            const {isNeedBypassEntryByKey} = registry.common.functions.get();

            const dlsBypassByKeyEnabled = isNeedBypassEntryByKey(
                ctx,
                joinedEntryRevision.key as string,
            );

            const checkPermissionEnabled =
                !isPrivateRoute && ctx.config.dlsEnabled && !dlsBypassByKeyEnabled;

            if (checkPermissionEnabled) {
                await DLS.checkPermission(
                    {ctx, trx},
                    {
                        entryId,
                        action: DlsActions.Read,
                    },
                );
            }
        }

        ctx.log('GET_ENTRY_META_SUCCESS');

        return joinedEntryRevision;
    } else {
        throw new NotExistEntryError();
    }
};
