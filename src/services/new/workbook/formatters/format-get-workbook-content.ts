import {CTX} from '../../../../types/models';

import {EntryPermissions} from '../../entry/types';
import {JoinedEntryRevisionFavoriteColumns} from '../../../../db/presentations/joined-entry-revision-favorite';

export type GetContentResult = {
    permissions?: EntryPermissions;
    isLocked: boolean;
} & JoinedEntryRevisionFavoriteColumns;

export const formatGetJoinedEntryRevisionFavorite = (
    ctx: CTX,
    joinedEntryRevisionFavorite: GetContentResult,
) => {
    return {
        entryId: joinedEntryRevisionFavorite.entryId,
        scope: joinedEntryRevisionFavorite.scope,
        type: joinedEntryRevisionFavorite.type,
        key: joinedEntryRevisionFavorite.displayKey,
        unversionedData: joinedEntryRevisionFavorite.unversionedData,
        createdBy: joinedEntryRevisionFavorite.createdBy,
        createdAt: joinedEntryRevisionFavorite.createdAt,
        updatedBy: joinedEntryRevisionFavorite.updatedBy,
        updatedAt: joinedEntryRevisionFavorite.updatedAt,
        savedId: joinedEntryRevisionFavorite.savedId,
        publishedId: joinedEntryRevisionFavorite.publishedId,
        revId: joinedEntryRevisionFavorite.revId,
        links: joinedEntryRevisionFavorite.links,
        tenantId: joinedEntryRevisionFavorite.tenantId,
        data: joinedEntryRevisionFavorite.data,
        meta: joinedEntryRevisionFavorite.meta,
        hidden: joinedEntryRevisionFavorite.hidden,
        public: joinedEntryRevisionFavorite.public,
        workbookId: joinedEntryRevisionFavorite.workbookId,
        isFavorite: joinedEntryRevisionFavorite.isFavorite,
        isLocked: joinedEntryRevisionFavorite.isLocked,
        permissions: joinedEntryRevisionFavorite.permissions,
    };
};

export const formatGetWorkbookContent = (
    ctx: CTX,
    {
        entries,
        nextPageToken,
    }: {
        entries: GetContentResult[];
        nextPageToken?: string;
    },
) => {
    return {
        entries: entries.map((entry) => formatGetJoinedEntryRevisionFavorite(ctx, entry)),
        nextPageToken,
    };
};
