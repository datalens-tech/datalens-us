import request from 'supertest';
import {testTenantId} from '../../constants';
import usApp from '../../../..';
import {withScopeHeaders} from '../../utils';

const app = usApp.express;

const testFolderName = 'entries-revisions-tests';

let testEntryId: string;
let testRevCreatedId: string;
let testRevSavedId: string;
let testRevPublishedId: string;
let folderRevSavedId: string;
let timeBeforeCreateLastRev: string;

const testMetaSaved = {
    body: 'test_meta_saved',
};
const testDataSaved = {
    body: 'test_data_saved',
};

const testMetaPublished = {
    body: 'test_meta_published',
};
const testDataPublished = {
    body: 'test_data_published',
};

describe('Creating entries', () => {
    test('Create folder – [POST /v1/entries]', async () => {
        const response = await withScopeHeaders(request(app).post('/v1/entries'))
            .send({
                key: testFolderName,
                scope: 'folder',
                type: '',
                meta: {},
            })
            .expect(200);

        const {body} = response;

        expect(body).toStrictEqual({
            createdAt: expect.any(String),
            createdBy: expect.any(String),
            data: null,
            entryId: expect.any(String),
            hidden: false,
            mirrored: false,
            key: `${testFolderName}/`,
            links: null,
            meta: {},
            public: false,
            publishedId: null,
            revId: expect.any(String),
            savedId: expect.any(String),
            scope: 'folder',
            tenantId: testTenantId,
            type: '',
            unversionedData: {},
            updatedAt: expect.any(String),
            updatedBy: expect.any(String),
            workbookId: null,
        });

        folderRevSavedId = body.savedId;
    });

    test('Create dataset – [POST /v1/entries]', async () => {
        const response = await withScopeHeaders(request(app).post('/v1/entries'))
            .send({
                scope: 'dataset',
                type: 'graph',
                key: `${testFolderName}/dataset`,
                meta: {},
                data: {},
            })
            .expect(200);

        const {body} = response;

        expect(body).toStrictEqual({
            createdAt: expect.any(String),
            createdBy: expect.any(String),
            data: {},
            entryId: expect.any(String),
            hidden: false,
            mirrored: false,
            key: `${testFolderName}/dataset`,
            links: null,
            meta: {},
            public: false,
            publishedId: null,
            revId: expect.any(String),
            savedId: expect.any(String),
            scope: 'dataset',
            tenantId: testTenantId,
            type: 'graph',
            unversionedData: {},
            updatedAt: expect.any(String),
            updatedBy: expect.any(String),
            workbookId: null,
        });

        testEntryId = body.entryId;
        testRevCreatedId = body.revId;
        testRevSavedId = body.savedId;
    });
});

describe('Get all revisions', () => {
    test('Create new revision and publish – [POST /v1/entries/:entryId]', async () => {
        const response = await withScopeHeaders(request(app).post(`/v1/entries/${testEntryId}`))
            .send({
                meta: testMetaPublished,
                data: testDataPublished,
                mode: 'publish',
            })
            .expect(200);

        const {body} = response;

        expect(body.entryId).toBe(testEntryId);

        expect(typeof body.savedId).toBe('string');
        expect(typeof body.publishedId).toBe('string');

        expect(body.savedId).not.toBe(testRevSavedId);
        expect(body.publishedId).not.toBe(testRevSavedId);

        expect(body.savedId).toBe(body.publishedId);

        expect(body.meta).toStrictEqual(testMetaPublished);
        expect(body.data).toStrictEqual(testDataPublished);

        testRevSavedId = body.savedId;
        testRevPublishedId = body.publishedId;
    });

    test('Create new revision without publishing – [POST /v1/entries/:entryId]', async () => {
        timeBeforeCreateLastRev = new Date().toISOString();

        const response = await withScopeHeaders(request(app).post(`/v1/entries/${testEntryId}`))
            .send({
                meta: testMetaSaved,
                data: testDataSaved,
                mode: 'save',
            })
            .expect(200);

        const {body} = response;

        expect(body.entryId).toBe(testEntryId);

        expect(typeof body.savedId).toBe('string');
        expect(body.savedId).not.toBe(testRevSavedId);
        expect(body.publishedId).toBe(testRevPublishedId);

        expect(body.savedId).not.toBe(body.publishedId);

        expect(body.meta).toStrictEqual(testMetaSaved);
        expect(body.data).toStrictEqual(testDataSaved);

        testRevSavedId = body.savedId;
    });

    test('Get all revisions of entry – [GET /v1/entries/:entryId/revisions]', async () => {
        const response = await withScopeHeaders(
            request(app).get(`/v1/entries/${testEntryId}/revisions`),
        ).expect(200);

        const {body} = response;

        expect(body).toStrictEqual({
            entries: [
                {
                    createdAt: expect.any(String),
                    createdBy: expect.any(String),
                    entryId: testEntryId,
                    hidden: false,
                    key: `${testFolderName}/dataset`,
                    meta: testMetaSaved,
                    publishedId: testRevPublishedId,
                    revId: testRevSavedId,
                    savedId: testRevSavedId,
                    scope: 'dataset',
                    type: 'graph',
                    updatedAt: expect.any(String),
                    updatedBy: expect.any(String),
                    workbookId: null,
                },
                {
                    createdAt: expect.any(String),
                    createdBy: expect.any(String),
                    entryId: testEntryId,
                    hidden: false,
                    key: `${testFolderName}/dataset`,
                    meta: testMetaPublished,
                    publishedId: testRevPublishedId,
                    revId: testRevPublishedId,
                    savedId: testRevSavedId,
                    scope: 'dataset',
                    type: 'graph',
                    updatedAt: expect.any(String),
                    updatedBy: expect.any(String),
                    workbookId: null,
                },
                {
                    createdAt: expect.any(String),
                    createdBy: expect.any(String),
                    entryId: testEntryId,
                    hidden: false,
                    key: `${testFolderName}/dataset`,
                    meta: {},
                    publishedId: testRevPublishedId,
                    revId: testRevCreatedId,
                    savedId: testRevSavedId,
                    scope: 'dataset',
                    type: 'graph',
                    updatedAt: expect.any(String),
                    updatedBy: expect.any(String),
                    workbookId: null,
                },
            ],
        });
    });

    test('Get entry revisions by revIds without another entry revisions – [GET /v1/entries/:entryId/revisions]', async () => {
        const response = await withScopeHeaders(
            request(app)
                .get(`/v1/entries/${testEntryId}/revisions`)
                .query({
                    revIds: [testRevCreatedId, folderRevSavedId],
                }),
        ).expect(200);

        const {body} = response;

        expect(body.entries).toHaveLength(1);

        expect(body).toStrictEqual({
            entries: [
                {
                    createdAt: expect.any(String),
                    createdBy: expect.any(String),
                    entryId: testEntryId,
                    hidden: false,
                    key: `${testFolderName}/dataset`,
                    meta: {},
                    publishedId: testRevPublishedId,
                    revId: testRevCreatedId,
                    savedId: testRevSavedId,
                    scope: 'dataset',
                    type: 'graph',
                    updatedAt: expect.any(String),
                    updatedBy: expect.any(String),
                    workbookId: null,
                },
            ],
        });
    });

    test('Get entry revisions by filter updatedAfter – [GET /v1/entries/:entryId/revisions]', async () => {
        const response = await withScopeHeaders(
            request(app).get(`/v1/entries/${testEntryId}/revisions`).query({
                updatedAfter: timeBeforeCreateLastRev,
            }),
        ).expect(200);

        const {body} = response;

        expect(body).toStrictEqual({
            entries: [
                {
                    createdAt: expect.any(String),
                    createdBy: expect.any(String),
                    entryId: testEntryId,
                    hidden: false,
                    key: `${testFolderName}/dataset`,
                    meta: testMetaSaved,
                    publishedId: testRevPublishedId,
                    revId: testRevSavedId,
                    savedId: testRevSavedId,
                    scope: 'dataset',
                    type: 'graph',
                    updatedAt: expect.any(String),
                    updatedBy: expect.any(String),
                    workbookId: null,
                },
            ],
        });
    });
});
