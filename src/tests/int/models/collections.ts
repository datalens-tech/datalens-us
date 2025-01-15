import {testTenantId} from '../auth';

export const COLLECTIONS_DEFAULT_FIELDS = {
    collectionId: expect.any(String),
    title: expect.any(String),
    description: null,
    parentId: null,
    createdAt: expect.any(String),
    createdBy: expect.any(String),
    updatedAt: expect.any(String),
    updatedBy: expect.any(String),
    meta: {},
    tenantId: testTenantId,
};

export const COLLECTIONS_DEFAULT_PERMISSIONS = {
    listAccessBindings: false,
    updateAccessBindings: false,
    createCollection: false,
    createWorkbook: false,
    limitedView: false,
    view: false,
    update: false,
    copy: false,
    move: false,
    delete: false,
};

export const GET_COLLECTION_CONTENT_DEFAULT_FIELDS = {
    collections: [],
    collectionsNextPageToken: null,
    workbooks: [],
    workbooksNextPageToken: null,
};

export const GET_STRUCTURE_ITEMS_DEFAULT_FIELDS = {
    items: [],
    nextPageToken: null,
};
