import {JoinedEntryRevisionColumns} from '../../../../db/presentations/joined-entry-revision';

export const formatGetEntryMetaResponse = (joinedEntryRevision: JoinedEntryRevisionColumns) => {
    let supportDescription: Optional<string>;
    let accessDescription: Optional<string>;

    if (joinedEntryRevision.scope === 'dash' && joinedEntryRevision.data) {
        if (joinedEntryRevision.data.supportDescription) {
            supportDescription = joinedEntryRevision.data.supportDescription as string;
        }
        if (joinedEntryRevision.data.accessDescription) {
            accessDescription = joinedEntryRevision.data.accessDescription as string;
        }
    }

    return {
        entryId: joinedEntryRevision.entryId,
        scope: joinedEntryRevision.scope,
        type: joinedEntryRevision.type,
        key: joinedEntryRevision.displayKey,
        meta: joinedEntryRevision.meta,
        annotation: joinedEntryRevision.annotation,
        savedId: joinedEntryRevision.savedId,
        publishedId: joinedEntryRevision.publishedId,
        tenantId: joinedEntryRevision.tenantId,
        workbookId: joinedEntryRevision.workbookId,
        collectionId: joinedEntryRevision.collectionId,
        supportDescription,
        accessDescription,
    };
};
