import {AppError} from '@gravity-ui/nodekit';

import {Feature, isEnabledFeature} from '../../../components/features';
import {makeSchemaValidator} from '../../../components/validation-schema-compiler';
import {US_ERRORS} from '../../../const';
import OldEntry from '../../../db/models/entry';
import {Entry, EntryColumn} from '../../../db/models/new/entry';
import {
    JoinedEntryRevisionFavorite,
    JoinedEntryRevisionFavoriteColumns,
} from '../../../db/presentations/joined-entry-revision-favorite';
import {DlsActions} from '../../../types/models';
import Utils from '../../../utils';
import {ServiceArgs} from '../types';
import {getReplica} from '../utils';
import {getWorkbook} from '../workbook';
import {getEntryPermissionsByWorkbook} from '../workbook/utils';

import {EntryPermissions} from './types';
import {checkFetchedEntry, checkWorkbookIsolation} from './utils';

const validateArgs = makeSchemaValidator({
    type: 'object',
    required: ['entryId', 'includePermissionsInfo', 'includeLinks'],
    properties: {
        entryId: {
            type: 'string',
        },
        revId: {
            type: 'string',
        },
        branch: {
            type: 'string',
            enum: ['saved', 'published'],
        },
        includePermissionsInfo: {
            type: 'boolean',
        },
        includeLinks: {
            type: 'boolean',
        },
    },
});

export interface GetEntryArgs {
    entryId: string;
    revId?: string;
    branch?: 'saved' | 'published';
    includePermissionsInfo: boolean;
    includeLinks: boolean;
}

export type GetEntryResult = {
    joinedEntryRevisionFavorite: JoinedEntryRevisionFavoriteColumns;
    permissions: EntryPermissions;
    includePermissionsInfo: boolean;
    includeLinks: boolean;
};

// eslint-disable-next-line complexity
export const getEntry = async (
    {ctx, trx, skipValidation = false}: ServiceArgs,
    args: GetEntryArgs,
): Promise<GetEntryResult> => {
    const {entryId, revId, branch = 'saved', includePermissionsInfo, includeLinks} = args;

    ctx.log('GET_ENTRY_REQUEST', {
        entryId: Utils.encodeId(entryId),
        revId,
        branch,
        includePermissionsInfo,
        includeLinks,
    });

    const registry = ctx.get('registry');
    const {DLS} = registry.common.classes.get();

    const {isPrivateRoute, user, onlyPublic, onlyMirrored} = ctx.get('info');

    if (!skipValidation) {
        validateArgs(args);
    }

    const {getEntryBeforeDbRequestHook, checkEmbedding} = registry.common.functions.get();

    await getEntryBeforeDbRequestHook({ctx, entryId});

    const isEmbedding = checkEmbedding({ctx});

    const joinedEntryRevisionFavorite = await JoinedEntryRevisionFavorite.findOne({
        where: (builder) => {
            builder.where({
                [`${Entry.tableName}.entryId`]: entryId,
                [`${Entry.tableName}.isDeleted`]: false,
            });

            if (revId) {
                builder.andWhere({revId});
            }

            if (onlyPublic) {
                builder.andWhere({public: true});
            }

            if (onlyMirrored) {
                builder.andWhere({mirrored: true});
            }
        },
        joinRevisionArgs: {
            revId,
            branch,
        },
        userLogin: user.login,
        trx: getReplica(trx),
    });

    if (joinedEntryRevisionFavorite) {
        const {isNeedBypassEntryByKey} = registry.common.functions.get();

        const dlsBypassByKeyEnabled = isNeedBypassEntryByKey(
            ctx,
            joinedEntryRevisionFavorite.key as string,
        );

        let dlsPermissions: any; // TODO: Update the type after refactoring DLS.checkPermission(...)
        let iamPermissions: Optional<EntryPermissions>;

        if (joinedEntryRevisionFavorite.workbookId) {
            const checkWorkbookEnabled =
                !isPrivateRoute && !onlyPublic && !onlyMirrored && !isEmbedding;

            if (checkWorkbookEnabled) {
                if (isEnabledFeature(ctx, Feature.WorkbookIsolationEnabled)) {
                    checkWorkbookIsolation({
                        ctx,
                        workbookId: joinedEntryRevisionFavorite.workbookId,
                    });
                }

                const workbook = await getWorkbook(
                    {ctx, trx},
                    {
                        workbookId: joinedEntryRevisionFavorite.workbookId,
                        includePermissionsInfo,
                    },
                );

                if (includePermissionsInfo) {
                    iamPermissions = getEntryPermissionsByWorkbook({
                        workbook,
                        scope: joinedEntryRevisionFavorite[EntryColumn.Scope],
                    });
                }
            }
        } else {
            const checkPermissionEnabled =
                !dlsBypassByKeyEnabled &&
                !isPrivateRoute &&
                ctx.config.dlsEnabled &&
                !onlyPublic &&
                !onlyMirrored;

            const checkEntryEnabled =
                !isPrivateRoute && !onlyPublic && !onlyMirrored && !isEmbedding;

            if (checkPermissionEnabled) {
                dlsPermissions = await DLS.checkPermission(
                    {ctx, trx},
                    {
                        entryId,
                        action: DlsActions.Execute,
                        includePermissionsInfo,
                    },
                );
            }

            if (checkEntryEnabled) {
                if (isEnabledFeature(ctx, Feature.WorkbookIsolationEnabled)) {
                    checkWorkbookIsolation({
                        ctx,
                        workbookId: null,
                    });
                }

                await checkFetchedEntry(ctx, joinedEntryRevisionFavorite, getReplica(trx));
            }
        }

        let permissions: EntryPermissions = {};
        if (includePermissionsInfo) {
            permissions = OldEntry.originatePermissions({
                isPrivateRoute,
                shared: onlyPublic || isEmbedding,
                permissions: dlsPermissions,
                iamPermissions,
                ctx,
            });
        }

        ctx.log('GET_ENTRY_SUCCESS');

        return {
            joinedEntryRevisionFavorite,
            permissions,
            includePermissionsInfo,
            includeLinks,
        };
    } else {
        throw new AppError(US_ERRORS.NOT_EXIST_ENTRY, {
            code: US_ERRORS.NOT_EXIST_ENTRY,
        });
    }
};
