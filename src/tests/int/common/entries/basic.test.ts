import request from 'supertest';
import {testTenantId} from '../../constants';
import usApp from '../../../..';
import Utils from '../../../../utils';
import {withScopeHeaders} from '../../utils';

const app = usApp.express;

const testFolderName = 'entries-basic-tests';

let testEntryId: string;
let testRevCreatedId: string;
let testRevSavedId: string;
let testRevPublishedId: string;

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

    test('Create widget recursively – [POST /v1/entries]', async () => {
        const key = `${testFolderName}/folder1/Folder2/folder3/Folder4/widget1`;

        const response = await withScopeHeaders(request(app).post('/v1/entries'))
            .send({
                scope: 'widget',
                type: '',
                key,
                meta: {},
                recursion: true,
            })
            .expect(200);

        const {body} = response;

        expect(body.key).toBe(key);
    });
});

describe('Managing revisions', () => {
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
});

describe('Getting entries', () => {
    test('Get entry by entryId – [/v1/entries/:entryId]', async () => {
        const response = await withScopeHeaders(
            request(app).get(`/v1/entries/${testEntryId}`),
        ).expect(200);

        const {body} = response;

        expect(body).toStrictEqual({
            createdAt: expect.any(String),
            createdBy: expect.any(String),
            data: testDataSaved,
            entryId: testEntryId,
            hidden: false,
            isFavorite: false,
            key: `${testFolderName}/dataset`,
            meta: testMetaSaved,
            public: false,
            publishedId: testRevPublishedId,
            revId: testRevSavedId,
            savedId: testRevSavedId,
            scope: 'dataset',
            tenantId: testTenantId,
            type: 'graph',
            updatedAt: expect.any(String),
            updatedBy: expect.any(String),
            workbookId: null,
        });
    });

    test('Get saved entry by entryId – [/v1/entries/:entryId?branch=saved]', async () => {
        const response = await withScopeHeaders(
            request(app).get(`/v1/entries/${testEntryId}?branch=saved`),
        ).expect(200);

        const {body} = response;

        expect(body).toStrictEqual({
            createdAt: expect.any(String),
            createdBy: expect.any(String),
            data: testDataSaved,
            entryId: testEntryId,
            hidden: false,
            isFavorite: false,
            key: `${testFolderName}/dataset`,
            meta: testMetaSaved,
            public: false,
            publishedId: testRevPublishedId,
            revId: testRevSavedId,
            savedId: testRevSavedId,
            scope: 'dataset',
            tenantId: testTenantId,
            type: 'graph',
            updatedAt: expect.any(String),
            updatedBy: expect.any(String),
            workbookId: null,
        });
    });

    test('Get published entry by entryId – [/v1/entries/:entryId?branch=published]', async () => {
        const response = await withScopeHeaders(
            request(app).get(`/v1/entries/${testEntryId}?branch=published`),
        ).expect(200);

        const {body} = response;

        expect(body).toStrictEqual({
            createdAt: expect.any(String),
            createdBy: expect.any(String),
            data: testDataPublished,
            entryId: testEntryId,
            hidden: false,
            isFavorite: false,
            key: `${testFolderName}/dataset`,
            meta: testMetaPublished,
            public: false,
            publishedId: testRevPublishedId,
            revId: testRevPublishedId,
            savedId: testRevSavedId,
            scope: 'dataset',
            tenantId: testTenantId,
            type: 'graph',
            updatedAt: expect.any(String),
            updatedBy: expect.any(String),
            workbookId: null,
        });
    });

    test('Get entry by entryId and revId – [/v1/entries/:entryId?revId=:revId]', async () => {
        const response = await withScopeHeaders(
            request(app).get(`/v1/entries/${testEntryId}?revId=${testRevCreatedId}`),
        ).expect(200);

        const {body} = response;

        expect(body).toStrictEqual({
            createdAt: expect.any(String),
            createdBy: expect.any(String),
            data: {},
            entryId: testEntryId,
            hidden: false,
            isFavorite: false,
            key: `${testFolderName}/dataset`,
            meta: {},
            public: false,
            publishedId: testRevPublishedId,
            revId: testRevCreatedId,
            savedId: testRevSavedId,
            scope: 'dataset',
            tenantId: testTenantId,
            type: 'graph',
            updatedAt: expect.any(String),
            updatedBy: expect.any(String),
            workbookId: null,
        });
    });
});

describe('Getting additional entries info', () => {
    test('Get meta by enrtyId – [GET /v1/entries/:entryId/meta]', async () => {
        const response = await withScopeHeaders(
            request(app).get(`/v1/entries/${testEntryId}/meta`),
        ).expect(200);

        const {body} = response;

        expect(body).toStrictEqual({
            entryId: testEntryId,
            key: `${testFolderName}/dataset`,
            meta: testMetaSaved,
            publishedId: testRevPublishedId,
            savedId: testRevSavedId,
            scope: 'dataset',
            tenantId: testTenantId,
            type: 'graph',
            workbookId: null,
        });
    });
});

describe('Delete / Recover entry', () => {
    test('Delete entry – [DELETE /v1/entries/:entryId]', async () => {
        const response = await withScopeHeaders(request(app).delete(`/v1/entries/${testEntryId}`))
            .send({})
            .expect(200);

        const {body} = response;

        expect(body).toStrictEqual({
            entryId: testEntryId,
            scope: 'dataset',
            type: 'graph',
            key: `__trash/${Utils.decodeId(testEntryId)}_dataset`,
            unversionedData: {},
            createdBy: expect.any(String),
            createdAt: expect.any(String),
            updatedBy: expect.any(String),
            updatedAt: expect.any(String),
            savedId: testRevSavedId,
            publishedId: testRevPublishedId,
            revId: testRevSavedId,
            tenantId: testTenantId,
            data: testDataSaved,
            meta: testMetaSaved,
            hidden: false,
            mirrored: false,
            public: false,
            workbookId: null,
            isDeleted: true,
            deletedAt: expect.any(String),
        });

        await withScopeHeaders(request(app).get(`/v1/entries/${testEntryId}`)).expect(404);
    });

    test('Recover deleted entry – [POST /v1/entries/:entryId]', async () => {
        const response = await withScopeHeaders(request(app).post(`/v1/entries/${testEntryId}`))
            .send({
                mode: 'recover',
            })
            .expect(200);

        const {body} = response;

        expect(body).toStrictEqual({
            createdAt: expect.any(String),
            createdBy: expect.any(String),
            data: testDataSaved,
            entryId: testEntryId,
            hidden: false,
            mirrored: false,
            key: `${testFolderName}/dataset`,
            meta: testMetaSaved,
            public: false,
            publishedId: testRevPublishedId,
            revId: testRevSavedId,
            savedId: testRevSavedId,
            scope: 'dataset',
            tenantId: testTenantId,
            type: 'graph',
            unversionedData: {},
            updatedAt: expect.any(String),
            updatedBy: expect.any(String),
            workbookId: null,
        });

        await withScopeHeaders(request(app).get(`/v1/entries/${testEntryId}`)).expect(200);
    });
});

describe('Rename entry', () => {
    test('Rename entry – [POST /v1/entries/:entryId/rename]', async () => {
        const response = await withScopeHeaders(
            request(app).post(`/v1/entries/${testEntryId}/rename`),
        )
            .send({
                name: 'test2',
            })
            .expect(200);

        const {body} = response;

        expect(body).toHaveLength(1);

        expect(body[0]).toStrictEqual({
            createdAt: expect.any(String),
            createdBy: expect.any(String),
            data: testDataPublished,
            entryId: testEntryId,
            hidden: false,
            mirrored: false,
            key: `${testFolderName}/test2`,
            meta: testMetaPublished,
            public: false,
            publishedId: testRevPublishedId,
            revId: testRevPublishedId,
            savedId: testRevSavedId,
            scope: 'dataset',
            tenantId: testTenantId,
            type: 'graph',
            unversionedData: {},
            updatedAt: expect.any(String),
            updatedBy: expect.any(String),
            workbookId: null,
        });
    });
});
