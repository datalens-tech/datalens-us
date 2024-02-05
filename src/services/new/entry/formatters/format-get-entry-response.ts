import {EntryPermissions} from '../types';
import {JoinedEntryRevisionFavoriteColumns} from '../../../../db/presentations/joined-entry-revision-favorite';
import {CTX} from '../../../../types/models';

interface GetEntryResult {
    joinedEntryRevisionFavorite: JoinedEntryRevisionFavoriteColumns;
    permissions: EntryPermissions;
    includePermissionsInfo: boolean;
    includeLinks: boolean;
}

export const formatGetEntryResponse = (
    ctx: CTX,
    {
        joinedEntryRevisionFavorite,
        permissions,
        includePermissionsInfo,
        includeLinks,
    }: GetEntryResult,
) => {
    const {privatePermissions, onlyPublic} = ctx.get('info');
    const _ctx: any = ctx;
    const rpc = _ctx.appParams.rpc;

    let isHiddenUnversionedData = false;
    if (!privatePermissions.ownedScopes.includes(joinedEntryRevisionFavorite?.scope!)) {
        isHiddenUnversionedData = true;
    }

    let isHiddenIsFavorite = false;
    if (onlyPublic) {
        isHiddenIsFavorite = true;
    }

    return Object.assign(
        {
            entryId: joinedEntryRevisionFavorite.entryId,
            scope: joinedEntryRevisionFavorite.scope,
            type: joinedEntryRevisionFavorite.type,
            key: joinedEntryRevisionFavorite.displayKey,
            unversionedData: isHiddenUnversionedData
                ? undefined
                : joinedEntryRevisionFavorite.unversionedData,
            createdBy: joinedEntryRevisionFavorite.createdBy,
            createdAt: joinedEntryRevisionFavorite.createdAt,
            updatedBy: joinedEntryRevisionFavorite.updatedBy,
            updatedAt: joinedEntryRevisionFavorite.updatedAt,
            savedId: joinedEntryRevisionFavorite.savedId,
            publishedId: joinedEntryRevisionFavorite.publishedId,
            revId: joinedEntryRevisionFavorite.revId,
            tenantId: joinedEntryRevisionFavorite.tenantId,
            data: joinedEntryRevisionFavorite.data,
            meta: joinedEntryRevisionFavorite.meta,
            hidden: joinedEntryRevisionFavorite.hidden,
            public: joinedEntryRevisionFavorite.public,
            workbookId: joinedEntryRevisionFavorite.workbookId,
            links: includeLinks ? joinedEntryRevisionFavorite.links : undefined,
            isFavorite: isHiddenIsFavorite ? undefined : joinedEntryRevisionFavorite.isFavorite,
            permissions: includePermissionsInfo ? permissions : undefined,
        },
        process.env.NODE_RPC_URL ? {rpc: rpc} : null,
    );
};
