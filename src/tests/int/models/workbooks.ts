import {testTenantId, testProjectId} from '../auth';

export const WORKBOOK_DEFAULT_FIELDS = {
    workbookId: expect.any(String),
    title: expect.any(String),
    description: null,
    collectionId: null,
    createdAt: expect.any(String),
    createdBy: expect.any(String),
    updatedAt: expect.any(String),
    updatedBy: expect.any(String),
    meta: {},
    tenantId: testTenantId,
    projectId: testProjectId,
};

export const WORKBOOKS_DEFAULT_PERMISSIONS = {
    listAccessBindings: false,
    updateAccessBindings: false,
    limitedView: false,
    view: false,
    update: false,
    copy: false,
    move: false,
    publish: false,
    embed: false,
    delete: false,
};