import {testTenantId} from '../auth';

export const STRUCTURE_SHARED_ENTRY_DEFAULT_FIELDS = {
    entryId: expect.any(String),
    scope: expect.any(String),
    type: expect.any(String),
    key: expect.any(String),
    displayKey: expect.any(String),
    createdBy: expect.any(String),
    createdAt: expect.any(String),
    updatedBy: expect.any(String),
    updatedAt: expect.any(String),
    tenantId: testTenantId,
    workbookId: null,
    collectionId: expect.any(String),
};
