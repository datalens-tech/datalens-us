import {Entry} from '../../../../db/models/new/entry';

export const formatEntryModel = (entryModel: Entry) => {
    return {
        entryId: entryModel.entryId,
        scope: entryModel.scope,
        type: entryModel.type,
        key: entryModel.displayKey,
        createdBy: entryModel.createdBy,
        createdAt: entryModel.createdAt,
        updatedBy: entryModel.updatedBy,
        updatedAt: entryModel.updatedAt,
        savedId: entryModel.savedId,
        publishedId: entryModel.publishedId,
        tenantId: entryModel.tenantId,
        workbookId: entryModel.workbookId,
        public: entryModel.public,
    };
};
