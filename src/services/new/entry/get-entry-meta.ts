import {AppError} from '@gravity-ui/nodekit';

import {makeSchemaValidator} from '../../../components/validation-schema-compiler';
import {US_ERRORS} from '../../../const';
import {Entry} from '../../../db/models/new/entry';
import {JoinedEntryRevision} from '../../../db/presentations/joined-entry-revision';
import {DlsActions} from '../../../types/models';
import Utils from '../../../utils';
import {ServiceArgs} from '../types';
import {getReplica} from '../utils';
import {getWorkbook} from '../workbook';

import {checkFetchedEntry} from './utils';

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
        const {isNeedBypassEntryByKey} = registry.common.functions.get();

        const dlsBypassByKeyEnabled = isNeedBypassEntryByKey(
            ctx,
            joinedEntryRevision.key as string,
        );

        if (joinedEntryRevision.workbookId) {
            if (!isPrivateRoute) {
                await getWorkbook({ctx, trx}, {workbookId: joinedEntryRevision.workbookId});
            }
        } else {
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

            if (!isPrivateRoute) {
                await checkFetchedEntry(ctx, joinedEntryRevision, getReplica(trx));
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
