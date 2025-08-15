import {JoinedEntryRevisionColumns} from '../../../../db/presentations/joined-entry-revision';

export const formatJoinedEntryRevisionModel = (joinedEntryRevision: JoinedEntryRevisionColumns) => {
    return {
        entryId: joinedEntryRevision.entryId,
        scope: joinedEntryRevision.scope,
        type: joinedEntryRevision.type,
        key: joinedEntryRevision.key,
        displayKey: joinedEntryRevision.displayKey,
        createdBy: joinedEntryRevision.createdBy,
        createdAt: joinedEntryRevision.createdAt,
        updatedBy: joinedEntryRevision.updatedBy,
        updatedAt: joinedEntryRevision.updatedAt,
        savedId: joinedEntryRevision.savedId,
        publishedId: joinedEntryRevision.publishedId,
        revId: joinedEntryRevision.revId,
        tenantId: joinedEntryRevision.tenantId,
        workbookId: joinedEntryRevision.workbookId,
        data: joinedEntryRevision.data,
        meta: joinedEntryRevision.meta,
        annotation: joinedEntryRevision.annotation,
        links: joinedEntryRevision.links,
    };
};
