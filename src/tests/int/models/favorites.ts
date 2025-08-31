import {testTenantId} from '../auth';

export const MODIFY_FAVORITES_DEFAULT_FIELDS = {
    entryId: expect.any(String),
    login: expect.any(String),
    tenantId: testTenantId,
    createdAt: expect.any(String),
    alias: null,
    displayAlias: null,
    sortAlias: null,
};

export const GET_FAVORITES_ENTRY_DEFAULT_FIELDS = {
    entryId: expect.any(String),
    key: expect.any(String),
    scope: expect.any(String),
    type: expect.any(String),
    alias: null,
    displayAlias: null,
    createdBy: expect.any(String),
    createdAt: expect.any(String),
    updatedAt: expect.any(String),
    hidden: false,
    workbookId: expect.any(String),
    collectionId: null,
    workbookTitle: expect.any(String),
    isLocked: false,
};
