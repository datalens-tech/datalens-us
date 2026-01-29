import {AppError} from '@gravity-ui/nodekit';

import {makeSchemaValidator} from '../../../components/validation-schema-compiler';
import {US_ERRORS} from '../../../const';
import {Entry} from '../../../db/models/new/entry';
import {JoinedEntryRevision} from '../../../db/presentations/joined-entry-revision';
import {DlsActions, UsPermissions} from '../../../types/models';
import Utils from '../../../utils';
import {ServiceArgs} from '../types';
import {getReplica} from '../utils';
import {getWorkbook} from '../workbook';

import {checkFetchedEntry} from './utils';
import {checkCollectionEntryPermission} from './utils/check-collection-entry-permission';

const validateArgs = makeSchemaValidator({
    type: 'object',
    required: ['entryId'],
    properties: {
        entryId: {
            type: 'string',
        },
        branch: {
            type: 'string',
            enum: ['saved', 'published'],
        },
    },
});

export type GetEntryMetaArgs = {
    entryId: string;
    branch?: 'saved' | 'published';
};

export const getEntryMeta = async (
    {ctx, trx, skipValidation = false}: ServiceArgs,
    args: GetEntryMetaArgs,
) => {
    const {entryId, branch = 'saved'} = args;

    ctx.log('GET_ENTRY_META_REQUEST', {
        entryId: Utils.encodeId(entryId),
    });

    const registry = ctx.get('registry');
    const {DLS} = registry.common.classes.get();

    if (!skipValidation) {
        validateArgs(args);
    }

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
            const {SharedEntry} = registry.common.classes.get();

            const sharedEntryInstance = new SharedEntry({
                ctx,
                model: joinedEntryRevision as unknown as Entry,
            });

            await checkCollectionEntryPermission(
                {ctx, trx: getReplica(trx)},
                {
                    sharedEntryInstance,
                    permission: UsPermissions.Read,
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
        throw new AppError(US_ERRORS.NOT_EXIST_ENTRY, {
            code: US_ERRORS.NOT_EXIST_ENTRY,
        });
    }
};
