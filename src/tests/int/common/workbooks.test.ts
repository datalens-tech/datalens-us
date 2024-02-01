import request from 'supertest';
import {testUserId, testTenantId, testProjectId} from '../constants';
import {US_MASTER_TOKEN_HEADER} from '../../../const';
import usApp from '../../..';
import {withScopeHeaders} from '../utils';

const app = usApp.express;

const workbooksData = [
    {
        id: null,
        title: 'Test workbook title 1',
        description: 'Test workbook description 1',
    },
    {
        id: null,
        title: 'Test workbook title 2',
        description: 'Test workbook description 2',
    },
];

let testWorkbookId: string;
let testCopiedWorkbookId: string;

const testTemplateWorkbookData = {
    id: null,
    title: 'Test template workbook title',
    description: 'Testt template workbook description',
};

describe('Workbooks managment', () => {
    test('Create workbooks – [POST /v2/workbooks]', async () => {
        const response1 = await withScopeHeaders(request(app).post('/v2/workbooks'))
            .send({
                title: workbooksData[0].title,
                description: workbooksData[0].description,
            })
            .expect(200);

        const {body: body1} = response1;

        expect(body1).toStrictEqual({
            collectionId: null,
            createdAt: expect.any(String),
            createdBy: testUserId,
            updatedAt: expect.any(String),
            updatedBy: testUserId,
            description: workbooksData[0].description,
            meta: {},
            projectId: testProjectId,
            tenantId: testTenantId,
            title: workbooksData[0].title,
            workbookId: expect.any(String),
        });

        workbooksData[0].id = body1.workbookId;

        const response2 = await withScopeHeaders(request(app).post('/v2/workbooks'))
            .send({
                title: workbooksData[1].title,
                description: workbooksData[1].description,
            })
            .expect(200);

        const {body: body2} = response2;

        expect(body2).toStrictEqual({
            collectionId: null,
            createdAt: expect.any(String),
            createdBy: testUserId,
            updatedAt: expect.any(String),
            updatedBy: testUserId,
            description: workbooksData[1].description,
            meta: {},
            projectId: testProjectId,
            tenantId: testTenantId,
            title: workbooksData[1].title,
            workbookId: expect.any(String),
        });

        workbooksData[1].id = body2.workbookId;
    });

    test('Get workbook by workbookId – [GET /v2/workbooks/:workbookId]', async () => {
        const response = await withScopeHeaders(
            request(app).get(`/v2/workbooks/${workbooksData[0].id}`),
        ).expect(200);

        const {body} = response;

        expect(body).toStrictEqual({
            createdAt: expect.any(String),
            createdBy: testUserId,
            updatedAt: expect.any(String),
            updatedBy: testUserId,
            description: workbooksData[0].description,
            meta: {},
            projectId: testProjectId,
            tenantId: testTenantId,
            title: workbooksData[0].title,
            workbookId: workbooksData[0].id,
            collectionId: null,
        });
    });

    test('Get list of workbooks – [GET /v2/workbooks]', async () => {
        const response = await withScopeHeaders(request(app).get(`/v2/workbooks`)).expect(200);

        const {body} = response;

        expect(body).toStrictEqual({
            workbooks: expect.arrayContaining([
                {
                    createdAt: expect.any(String),
                    createdBy: testUserId,
                    updatedAt: expect.any(String),
                    updatedBy: testUserId,
                    description: workbooksData[1].description,
                    meta: {},
                    projectId: testProjectId,
                    tenantId: testTenantId,
                    title: workbooksData[1].title,
                    workbookId: workbooksData[1].id,
                    collectionId: null,
                },
                {
                    createdAt: expect.any(String),
                    createdBy: testUserId,
                    updatedAt: expect.any(String),
                    updatedBy: testUserId,
                    description: workbooksData[0].description,
                    meta: {},
                    projectId: testProjectId,
                    tenantId: testTenantId,
                    title: workbooksData[0].title,
                    workbookId: workbooksData[0].id,
                    collectionId: null,
                },
            ]),
        });
    });

    test('Get list of workbooks with pagination – [GET /v2/workbooks]', async () => {
        const response1 = await withScopeHeaders(request(app).get(`/v2/workbooks`))
            .query({
                page: 0,
                pageSize: 1,
            })
            .expect(200);

        const {body: body1} = response1;

        expect(body1).toStrictEqual({
            nextPageToken: expect.any(String),
            workbooks: expect.arrayContaining([
                {
                    createdAt: expect.any(String),
                    createdBy: testUserId,
                    updatedAt: expect.any(String),
                    updatedBy: testUserId,
                    description: workbooksData[0].description,
                    meta: {},
                    projectId: testProjectId,
                    tenantId: testTenantId,
                    title: workbooksData[0].title,
                    workbookId: workbooksData[0].id,
                    collectionId: null,
                },
            ]),
        });

        const nextPageToken = body1.nextPageToken;

        const response2 = await withScopeHeaders(request(app).get(`/v2/workbooks`))
            .query({
                page: nextPageToken,
                pageSize: 1,
            })
            .expect(200);

        const {body: body2} = response2;

        expect(body2).toStrictEqual({
            workbooks: expect.arrayContaining([
                {
                    createdAt: expect.any(String),
                    createdBy: testUserId,
                    updatedAt: expect.any(String),
                    updatedBy: testUserId,
                    description: workbooksData[1].description,
                    meta: {},
                    projectId: testProjectId,
                    tenantId: testTenantId,
                    title: workbooksData[1].title,
                    workbookId: workbooksData[1].id,
                    collectionId: null,
                },
            ]),
        });
    });

    test('Update workbook by workbookId – [POST /v2/workbooks/:workbookId/update]', async () => {
        workbooksData[0].title = 'Renamed test workbook title 1';
        workbooksData[0].description = 'Renamed test workbook description 1';

        const response = await withScopeHeaders(
            request(app).post(`/v2/workbooks/${workbooksData[0].id}/update`),
        )
            .send({
                title: workbooksData[0].title,
                description: workbooksData[0].description,
            })
            .expect(200);

        const {body} = response;

        expect(body).toStrictEqual({
            createdAt: expect.any(String),
            createdBy: testUserId,
            updatedAt: expect.any(String),
            updatedBy: testUserId,
            description: workbooksData[0].description,
            meta: {},
            projectId: testProjectId,
            tenantId: testTenantId,
            title: workbooksData[0].title,
            workbookId: expect.any(String),
            collectionId: null,
        });
    });

    test('Delete workbooks – [DELETE /v2/workbooks/:workbookId]', async () => {
        await withScopeHeaders(request(app).delete(`/v2/workbooks/${workbooksData[0].id}`)).expect(
            200,
        );
        await withScopeHeaders(request(app).delete(`/v2/workbooks/${workbooksData[1].id}`)).expect(
            200,
        );

        await withScopeHeaders(request(app).get(`/v2/workbooks/${workbooksData[0].id}`)).expect(
            404,
        );
        await withScopeHeaders(request(app).get(`/v2/workbooks/${workbooksData[1].id}`)).expect(
            404,
        );

        const response = await withScopeHeaders(request(app).get(`/v2/workbooks`)).expect(200);

        const {body} = response;

        expect(body).toStrictEqual({
            workbooks: [],
        });
    });
});

describe('Entries in workboooks managment', () => {
    const testTitle = 'Test workbook with entries title';
    const testDescription = 'Test workbook with entries description';

    test('Create workbook with entries – [POST /v2/workbooks]', async () => {
        const entry1Name = 'Entry in test workbook 1';
        const entry2Name = 'Entry in test workbook 2';

        const responseWorkbook = await withScopeHeaders(request(app).post('/v2/workbooks'))
            .send({
                title: testTitle,
                description: testDescription,
            })
            .expect(200);

        const {body: bodyWorkbook} = responseWorkbook;

        expect(bodyWorkbook).toStrictEqual({
            createdAt: expect.any(String),
            createdBy: testUserId,
            updatedAt: expect.any(String),
            updatedBy: testUserId,
            description: testDescription,
            meta: {},
            projectId: testProjectId,
            tenantId: testTenantId,
            title: testTitle,
            workbookId: expect.any(String),
            collectionId: null,
        });

        testWorkbookId = bodyWorkbook.workbookId;

        const responseEntry1 = await withScopeHeaders(request(app).post('/v1/entries'))
            .send({
                scope: 'dataset',
                type: 'graph',
                meta: {},
                data: {},
                name: entry1Name,
                workbookId: testWorkbookId,
            })
            .expect(200);

        const {body: bodyEntry1} = responseEntry1;

        expect(bodyEntry1).toStrictEqual({
            createdAt: expect.any(String),
            createdBy: expect.any(String),
            data: {},
            entryId: expect.any(String),
            hidden: false,
            mirrored: false,
            key: expect.any(String),
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
            workbookId: testWorkbookId,
        });

        const responseEntry2 = await withScopeHeaders(request(app).post('/v1/entries'))
            .send({
                scope: 'dataset',
                type: 'graph',
                meta: {},
                data: {},
                name: entry2Name,
                workbookId: testWorkbookId,
            })
            .expect(200);

        const {body: bodyEntry2} = responseEntry2;

        expect(bodyEntry2).toStrictEqual({
            createdAt: expect.any(String),
            createdBy: expect.any(String),
            data: {},
            entryId: expect.any(String),
            hidden: false,
            mirrored: false,
            key: expect.any(String),
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
            workbookId: testWorkbookId,
        });
    });

    test('Get workbook entries – [GET /v2/workbooks/entries]', async () => {
        const response = await withScopeHeaders(
            request(app).get(`/v2/workbooks/${testWorkbookId}/entries`),
        ).expect(200);

        const {body} = response;

        expect(body).toStrictEqual({
            entries: expect.arrayContaining([
                {
                    createdAt: expect.any(String),
                    createdBy: expect.any(String),
                    entryId: expect.any(String),
                    hidden: false,
                    mirrored: false,
                    isLocked: false,
                    isFavorite: false,
                    key: expect.any(String),
                    meta: {},
                    publishedId: null,
                    savedId: expect.any(String),
                    scope: 'dataset',
                    type: 'graph',
                    updatedAt: expect.any(String),
                    updatedBy: expect.any(String),
                    workbookId: testWorkbookId,
                },
                {
                    createdAt: expect.any(String),
                    createdBy: expect.any(String),
                    entryId: expect.any(String),
                    hidden: false,
                    mirrored: false,
                    isLocked: false,
                    isFavorite: false,
                    key: expect.any(String),
                    meta: {},
                    publishedId: null,
                    savedId: expect.any(String),
                    scope: 'dataset',
                    type: 'graph',
                    updatedAt: expect.any(String),
                    updatedBy: expect.any(String),
                    workbookId: testWorkbookId,
                },
            ]),
        });
    });

    test('Copy workbook with entries – [POST /v2/workbooks/:workbookId/copy]', async () => {
        const testNewTitle = 'Copied test workbook with entries title';

        const response = await withScopeHeaders(
            request(app).post(`/v2/workbooks/${testWorkbookId}/copy`),
        ).send({
            newTitle: testNewTitle,
        });

        const {body} = response;

        expect(body).toStrictEqual({
            collectionId: null,
            createdAt: expect.any(String),
            createdBy: testUserId,
            updatedAt: expect.any(String),
            updatedBy: testUserId,
            description: testDescription,
            meta: {},
            projectId: testProjectId,
            tenantId: testTenantId,
            title: testNewTitle,
            workbookId: expect.any(String),
        });

        expect(body.workbookId).not.toBe(testWorkbookId);

        testCopiedWorkbookId = body.workbookId;
    });

    test('Check entries in copied workbook – [GET /v2/workbooks/entries]', async () => {
        const response = await withScopeHeaders(
            request(app).get(`/v2/workbooks/${testCopiedWorkbookId}/entries`),
        ).expect(200);

        const {body} = response;

        expect(body).toStrictEqual({
            entries: expect.arrayContaining([
                {
                    createdAt: expect.any(String),
                    createdBy: expect.any(String),
                    entryId: expect.any(String),
                    hidden: false,
                    mirrored: false,
                    isLocked: false,
                    isFavorite: false,
                    key: expect.any(String),
                    meta: {},
                    publishedId: null,
                    savedId: expect.any(String),
                    scope: 'dataset',
                    type: 'graph',
                    updatedAt: expect.any(String),
                    updatedBy: expect.any(String),
                    workbookId: testCopiedWorkbookId,
                },
                {
                    createdAt: expect.any(String),
                    createdBy: expect.any(String),
                    entryId: expect.any(String),
                    hidden: false,
                    mirrored: false,
                    isLocked: false,
                    isFavorite: false,
                    key: expect.any(String),
                    meta: {},
                    publishedId: null,
                    savedId: expect.any(String),
                    scope: 'dataset',
                    type: 'graph',
                    updatedAt: expect.any(String),
                    updatedBy: expect.any(String),
                    workbookId: testCopiedWorkbookId,
                },
            ]),
        });
    });

    test('Delete workbooks with entries – [DELETE /v2/workbooks/:workbookId]', async () => {
        await withScopeHeaders(request(app).delete(`/v2/workbooks/${testWorkbookId}`)).expect(200);
        await withScopeHeaders(request(app).delete(`/v2/workbooks/${testCopiedWorkbookId}`)).expect(
            200,
        );

        await withScopeHeaders(request(app).get(`/v2/workbooks/${testWorkbookId}`)).expect(404);
        await withScopeHeaders(request(app).get(`/v2/workbooks/${testCopiedWorkbookId}`)).expect(
            404,
        );
    });
});

describe('Workbook template', () => {
    test('Create workbook – [POST /v2/workbooks]', async () => {
        const response = await withScopeHeaders(request(app).post('/v2/workbooks'))
            .send({
                title: testTemplateWorkbookData.title,
                description: testTemplateWorkbookData.description,
            })
            .expect(200);

        const {body} = response;

        expect(body).toStrictEqual({
            collectionId: null,
            createdAt: expect.any(String),
            createdBy: testUserId,
            updatedAt: expect.any(String),
            updatedBy: testUserId,
            description: testTemplateWorkbookData.description,
            meta: {},
            projectId: testProjectId,
            tenantId: testTenantId,
            title: testTemplateWorkbookData.title,
            workbookId: expect.any(String),
        });

        testTemplateWorkbookData.id = body.workbookId;
    });

    test('Make workbook as template – [POST /private/v2/workbooks/:workbookId/setIsTemplate]', async () => {
        await request(app)
            .post(`/private/v2/workbooks/${testTemplateWorkbookData.id}/setIsTemplate`)
            .send({
                workbookId: testTemplateWorkbookData.id,
                isTemplate: true,
            })
            .expect(403);

        const response = await request(app)
            .post(`/private/v2/workbooks/${testTemplateWorkbookData.id}/setIsTemplate`)
            .set({[US_MASTER_TOKEN_HEADER]: usApp.config.masterToken})
            .send({
                workbookId: testTemplateWorkbookData.id,
                isTemplate: true,
            });

        const {body} = response;

        expect(body).toStrictEqual({
            workbookId: expect.any(String),
            isTemplate: true,
        });
    });
});
