import request from 'supertest';

import {systemUserId} from '../../../../constants';
import {WORKBOOK_DEFAULT_FIELDS} from '../../../../models';
import {routes} from '../../../../routes';
import {app, authMasterToken, testTenantId} from '../../auth';

const workbooksData = {
    id: null,
    title: 'Test workbook title private',
    description: 'Test workbook description private',
};

let testWorkbookId: string;

describe('Private Workbooks managment', () => {
    test('Create workbooks validation error', async () => {
        await authMasterToken(request(app).post(routes.privateWorkbooks))
            .send({
                title: `${workbooksData.title}/`,
                description: workbooksData.description,
            })
            .expect(400);

        await authMasterToken(request(app).post(routes.privateWorkbooks))
            .send({
                title: `${workbooksData.title}\u206a`,
                description: workbooksData.description,
            })
            .expect(400);
    });

    test('Create workbooks', async () => {
        await request(app).post(routes.privateWorkbooks).expect(403);

        const response1 = await authMasterToken(request(app).post(routes.privateWorkbooks))
            .send({
                title: workbooksData.title,
                description: workbooksData.description,
            })
            .expect(200);

        const {body: body1} = response1;

        expect(body1).toStrictEqual({
            ...WORKBOOK_DEFAULT_FIELDS,
            collectionId: null,
            createdBy: systemUserId,
            updatedBy: systemUserId,
            description: workbooksData.description,
            title: workbooksData.title,
        });

        workbooksData.id = body1.workbookId;

        await request(app).get(`${routes.privateWorkbooks}/${body1.workbookId}`).expect(403);

        const response2 = await authMasterToken(
            request(app).get(`${routes.privateWorkbooks}/${body1.workbookId}`),
        ).expect(200);

        const {body: body2} = response2;

        expect(body2).toStrictEqual({
            ...WORKBOOK_DEFAULT_FIELDS,
            collectionId: null,
            createdBy: systemUserId,
            updatedBy: systemUserId,
            description: workbooksData.description,
            title: workbooksData.title,
            workbookId: expect.any(String),
        });
    });
});

describe('Private Entries in workboooks managment', () => {
    test('Create workbook with entries', async () => {
        const testTitle = 'Test workbook with entries title';
        const testDescription = 'Test workbook with entries description';

        const entry1Name = 'Entry in test workbook 1';

        const responseWorkbook = await authMasterToken(request(app).post(routes.privateWorkbooks))
            .send({
                title: testTitle,
                description: testDescription,
            })
            .expect(200);

        const {body: bodyWorkbook} = responseWorkbook;

        testWorkbookId = bodyWorkbook.workbookId;

        await authMasterToken(request(app).post(routes.privateEntries))
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

    test('Get workbook entries', async () => {
        await request(app).get(`${routes.privateWorkbooks}/${testWorkbookId}/entries`).expect(403);

        const response = await authMasterToken(
            request(app).get(`${routes.privateWorkbooks}/${testWorkbookId}/entries`),
        ).expect(200);

        const {body} = response;

        expect(body).toStrictEqual({
            entries: expect.arrayContaining([
                {
                    createdAt: expect.any(String),
                    createdBy: expect.any(String),
                    entryId: expect.any(String),
                    hidden: false,
                    isLocked: false,
                    isFavorite: false,
                    key: expect.any(String),
                    displayKey: expect.any(String),
                    meta: {},
                    mirrored: false,
                    publishedId: null,
                    savedId: expect.any(String),
                    revId: expect.any(String),
                    scope: 'dataset',
                    type: 'graph',
                    updatedAt: expect.any(String),
                    updatedBy: expect.any(String),
                    workbookId: testWorkbookId,
                    tenantId: testTenantId,
                },
            ]),
        });
    });
});
