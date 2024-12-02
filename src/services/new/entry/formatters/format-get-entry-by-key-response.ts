import {JoinedEntryRevisionColumns} from '../../../../db/presentations/joined-entry-revision';
import {CTX} from '../../../../types/models';
import {EntryPermissions} from '../types';

interface GetEntryByKeyResult {
    joinedEntryRevision: JoinedEntryRevisionColumns;
    permissions: EntryPermissions;
    includePermissionsInfo: boolean;
    includeLinks: boolean;
}

export const formatGetEntryByKeyResponse = (
    ctx: CTX,
    {joinedEntryRevision, permissions, includePermissionsInfo, includeLinks}: GetEntryByKeyResult,
) => {
    const {privatePermissions} = ctx.get('info');

    let isHiddenUnversionedData = false;
    if (!privatePermissions.ownedScopes.includes(joinedEntryRevision?.scope!)) {
        isHiddenUnversionedData = true;
    }

    return {
        entryId: joinedEntryRevision.entryId,
        scope: joinedEntryRevision.scope,
        type: joinedEntryRevision.type,
        key: joinedEntryRevision.displayKey,
        unversionedData: isHiddenUnversionedData ? undefined : joinedEntryRevision.unversionedData,
        createdBy: joinedEntryRevision.createdBy,
        createdAt: joinedEntryRevision.createdAt,
        updatedBy: joinedEntryRevision.updatedBy,
        updatedAt: joinedEntryRevision.updatedAt,
        savedId: joinedEntryRevision.savedId,
        publishedId: joinedEntryRevision.publishedId,
        revId: joinedEntryRevision.revId,
        tenantId: joinedEntryRevision.tenantId,
        data: joinedEntryRevision.data,
        meta: joinedEntryRevision.meta,
        hidden: joinedEntryRevision.hidden,
        public: joinedEntryRevision.public,
        workbookId: joinedEntryRevision.workbookId,
        links: includeLinks ? joinedEntryRevision.links : undefined,
        permissions: includePermissionsInfo ? permissions : undefined,
    };
};
