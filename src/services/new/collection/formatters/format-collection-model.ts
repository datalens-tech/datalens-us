import {CollectionModel} from '../../../../db/models/new/collection';

export const formatCollectionModel = (model: CollectionModel) => {
    return {
        collectionId: model.collectionId,
        title: model.title,
        description: model.description,
        parentId: model.parentId,
        projectId: model.projectId,
        tenantId: model.tenantId,
        createdBy: model.createdBy,
        createdAt: model.createdAt,
        updatedBy: model.updatedBy,
        updatedAt: model.updatedAt,
        meta: model.meta,
    };
};
