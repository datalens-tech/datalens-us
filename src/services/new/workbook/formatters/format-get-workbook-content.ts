import {EntryPermissions} from '../../entry/types';
import {JoinedEntryRevisionFavoriteColumns} from '../../../../db/presentations/joined-entry-revision-favorite';

export type GetContentResult = {
    permissions?: EntryPermissions;
    isLocked: boolean;
} & JoinedEntryRevisionFavoriteColumns;

export const formatGetJoinedEntryRevisionFavorite = (
    joinedEntryRevisionFavorite: GetContentResult,
) => {
    return {
        entryId: joinedEntryRevisionFavorite.entryId,
        scope: joinedEntryRevisionFavorite.scope,
        type: joinedEntryRevisionFavorite.type,
        key: joinedEntryRevisionFavorite.displayKey,
        createdBy: joinedEntryRevisionFavorite.createdBy,
        createdAt: joinedEntryRevisionFavorite.createdAt,
        updatedBy: joinedEntryRevisionFavorite.updatedBy,
        updatedAt: joinedEntryRevisionFavorite.updatedAt,
        savedId: joinedEntryRevisionFavorite.savedId,
        publishedId: joinedEntryRevisionFavorite.publishedId,
        meta: joinedEntryRevisionFavorite.meta,
        hidden: joinedEntryRevisionFavorite.hidden,
        workbookId: joinedEntryRevisionFavorite.workbookId,
        isFavorite: joinedEntryRevisionFavorite.isFavorite,
        isLocked: joinedEntryRevisionFavorite.isLocked,
        permissions: joinedEntryRevisionFavorite.permissions,
        mirrored: joinedEntryRevisionFavorite.mirrored,
    };
};

export const formatGetWorkbookContent = ({
    entries,
    nextPageToken,
}: {
    entries: GetContentResult[];
    nextPageToken?: string;
}) => {
    return {
        entries: entries.map((entry) => formatGetJoinedEntryRevisionFavorite(entry)),
        nextPageToken,
    };
};
