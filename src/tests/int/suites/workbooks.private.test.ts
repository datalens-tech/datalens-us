import request from 'supertest';
import {systemId, testTenantId, testProjectId} from '../constants';
import {US_MASTER_TOKEN_HEADER} from '../../../const';
import usApp from '../../..';
import {auth} from '../utils';

const app = usApp.express;
const masterToken = usApp.config.masterToken[0];

const workbooksData = {
    id: null,
    title: 'Test private workbook title 1',
    description: 'Test private workbook description 1',
};

let testWorkbookId: string;

describe('Private Workbooks managment', () => {
    test('Create workbooks – [POST /private/v2/workbooks]', async () => {
        await request(app).post('/private/v2/workbooks').expect(403);

        const response1 = await auth(request(app).post('/private/v2/workbooks'))
            .set({[US_MASTER_TOKEN_HEADER]: masterToken})
            .send({
                title: workbooksData.title,
                description: workbooksData.description,
            })
            .expect(200);

        const {body: body1} = response1;

        expect(body1).toStrictEqual({
            collectionId: null,
            createdAt: expect.any(String),
            createdBy: systemId,
            updatedAt: expect.any(String),
            updatedBy: systemId,
            description: workbooksData.description,
            meta: {},
            projectId: testProjectId,
            tenantId: testTenantId,
            title: workbooksData.title,
            workbookId: expect.any(String),
        });

        workbooksData.id = body1.workbookId;

        await request(app).get(`/private/v2/workbooks/${body1.workbookId}`).expect(403);

        const response2 = await auth(request(app).get(`/private/v2/workbooks/${body1.workbookId}`))
            .set({[US_MASTER_TOKEN_HEADER]: masterToken})
            .expect(200);

        const {body: body2} = response2;

        expect(body2).toStrictEqual({
            collectionId: null,
            createdAt: expect.any(String),
            createdBy: systemId,
            updatedAt: expect.any(String),
            updatedBy: systemId,
            description: workbooksData.description,
            meta: {},
            projectId: testProjectId,
            tenantId: testTenantId,
            title: workbooksData.title,
            workbookId: expect.any(String),
        });

        await auth(request(app).delete(`/v2/workbooks/${workbooksData.id}`)).expect(200);
    });
});

describe('Private Entries in workboooks managment', () => {
    test('Create workbook with entries – [POST /private/v2/workbooks]', async () => {
        const testTitle = 'Test private workbook with entries title';
        const testDescription = 'Test private workbook with entries description';

        const entry1Name = 'Entry in test workbook 1';

        const responseWorkbook = await auth(request(app).post('/private/v2/workbooks'))
            .set({[US_MASTER_TOKEN_HEADER]: masterToken})
            .send({
                title: testTitle,
                description: testDescription,
            })
            .expect(200);

        const {body: bodyWorkbook} = responseWorkbook;

        testWorkbookId = bodyWorkbook.workbookId;

        await auth(request(app).post('/v1/entries'))
            .send({
                scope: 'dataset',
                type: 'graph',
                meta: {},
                data: {},
                name: entry1Name,
                workbookId: testWorkbookId,
            })
            .expect(200);
    });

    test('Get workbook entries – [GET /private/v2/workbooks/entries]', async () => {
        await request(app).get('/private/v2/workbooks/entries').expect(403);

        const response = await auth(
            request(app)
                .get(`/private/v2/workbooks/${testWorkbookId}/entries`)
                .set({[US_MASTER_TOKEN_HEADER]: masterToken}),
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
            ]),
        });

        await auth(request(app).delete(`/v2/workbooks/${testWorkbookId}`)).expect(200);
    });
});

describe('Private for one workboook managment', () => {
    test('Create workbook with entries – [POST /private/v2/workbooks]', async () => {
        const testTitle = 'Test private workbook with entries title';
        const testDescription = 'Test private workbook with entries description';

        const entry1Name = 'Entry in test workbook 1';

        const responseWorkbook = await auth(request(app).post('/private/v2/workbooks'))
            .set({[US_MASTER_TOKEN_HEADER]: masterToken})
            .send({
                title: testTitle,
                description: testDescription,
            })
            .expect(200);

        const {body: bodyWorkbook} = responseWorkbook;

        testWorkbookId = bodyWorkbook.workbookId;

        await auth(request(app).post('/v1/entries'))
            .send({
                scope: 'dataset',
                type: 'graph',
                meta: {},
                data: {},
                name: entry1Name,
                workbookId: testWorkbookId,
            })
            .expect(200);
    });

    test('Restore workbook with entries – [POST /private/v2/workbooks/:workbookId/restore]', async () => {
        await auth(request(app).delete(`/v2/workbooks/${testWorkbookId}`)).expect(200);

        await request(app).post(`/private/v2/workbooks/${testWorkbookId}/restore`).expect(403);

        const response = await auth(
            request(app)
                .post(`/private/v2/workbooks/${testWorkbookId}/restore`)
                .set({[US_MASTER_TOKEN_HEADER]: masterToken}),
        ).expect(200);

        const {body} = response;

        expect(body).toStrictEqual({
            workbookId: testWorkbookId,
        });

        const responseEntries = await auth(
            request(app)
                .get(`/private/v2/workbooks/${testWorkbookId}/entries`)
                .set({[US_MASTER_TOKEN_HEADER]: masterToken}),
        ).expect(200);

        const {body: bodyEntries} = responseEntries;

        expect(bodyEntries).toStrictEqual({
            entries: expect.arrayContaining([
                {
                    createdAt: expect.any(String),
                    createdBy: expect.any(String),
                    entryId: expect.any(String),
                    hidden: false,
                    mirrored: false,
                    isLocked: false,
                    key: expect.any(String),
                    meta: {},
                    isFavorite: false,
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

        await auth(request(app).delete(`/v2/workbooks/${testWorkbookId}`)).expect(200);
    });
});
