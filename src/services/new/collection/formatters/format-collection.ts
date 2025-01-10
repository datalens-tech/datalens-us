import type {CollectionInstance} from '../../../../registry/common/entities/collection/types';

export const formatCollection = (collection: CollectionInstance) => {
    return {
        collectionId: collection.model.collectionId,
        title: collection.model.title,
        description: collection.model.description,
        parentId: collection.model.parentId,
        tenantId: collection.model.tenantId,
        createdBy: collection.model.createdBy,
        createdAt: collection.model.createdAt,
        updatedBy: collection.model.updatedBy,
        updatedAt: collection.model.updatedAt,
        meta: collection.model.meta,
        permissions: collection.permissions,
    };
};
