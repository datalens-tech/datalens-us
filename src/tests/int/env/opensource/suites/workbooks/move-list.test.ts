import request from 'supertest';
import {app, auth} from '../../auth';
import {createMockCollection, createMockWorkbook} from '../../helpers';
import {routes} from '../../../../routes';
import {WORKBOOK_DEFAULT_FIELDS} from '../../../../models';
import {OpensourceRole} from '../../roles';

const rootCollection = {
    collectionId: '',
    title: 'Root collection',
};

const targetWorkbook = {
    collectionId: null,
    workbookId: '',
    title: 'Target workbook',
};

const targetWorkbook2 = {
    collectionId: null,
    workbookId: '',
    title: 'Target workbook 2',
};

describe('Setup', () => {
    test('Create root collection', async () => {
        const collection = await createMockCollection({
            title: rootCollection.title,
            parentId: null,
        });
        rootCollection.collectionId = collection.collectionId;
    });

    test('Create target workbooks', async () => {
        const workbook = await createMockWorkbook({
            title: targetWorkbook.title,
            collectionId: null,
        });
        targetWorkbook.workbookId = workbook.workbookId;

        const workbook2 = await createMockWorkbook({
            title: targetWorkbook2.title,
            collectionId: null,
        });
        targetWorkbook2.workbookId = workbook2.workbookId;
    });
});

describe('Moving workbooks', () => {
    test('Auth error', async () => {
        await request(app).post(routes.moveWorkbooks).expect(401);
    });

    test('Update without permission error', async () => {
        await auth(request(app).post(routes.moveWorkbooks))
            .send({
                collectionId: rootCollection.collectionId,
                workbookIds: [targetWorkbook.workbookId, targetWorkbook2.workbookId],
            })
            .expect(403);
    });

    test('Update with incorrect permission error', async () => {
        await auth(request(app).post(routes.moveWorkbooks))
            .send({
                collectionId: rootCollection.collectionId,
                workbookIds: [targetWorkbook.workbookId, targetWorkbook2.workbookId],
            })
            .expect(403);
    });

    test('Incorrect params validation errors (without collectionId)', async () => {
        await auth(request(app).post(routes.moveWorkbooks), {
            role: OpensourceRole.Editor,
        }).expect(400);
    });

    test('Move to root collection', async () => {
        const response = await auth(request(app).post(routes.moveWorkbooks), {
            role: OpensourceRole.Editor,
        })
            .send({
                collectionId: rootCollection.collectionId,
                workbookIds: [targetWorkbook.workbookId, targetWorkbook2.workbookId],
            })
            .expect(200);

        expect(response.body).toStrictEqual({
            workbooks: expect.arrayContaining([
                {
                    ...WORKBOOK_DEFAULT_FIELDS,
                    workbookId: targetWorkbook.workbookId,
                    title: targetWorkbook.title,
                    collectionId: rootCollection.collectionId,
                },
                {
                    ...WORKBOOK_DEFAULT_FIELDS,
                    workbookId: targetWorkbook2.workbookId,
                    title: targetWorkbook2.title,
                    collectionId: rootCollection.collectionId,
                },
            ]),
        });
    });

    test('Get moved', async () => {
        const response = await auth(
            request(app).get(`${routes.workbooks}/${targetWorkbook.workbookId}`),
        ).expect(200);

        expect(response.body).toStrictEqual({
            ...WORKBOOK_DEFAULT_FIELDS,
            workbookId: targetWorkbook.workbookId,
            title: targetWorkbook.title,
            collectionId: rootCollection.collectionId,
        });

        const response2 = await auth(
            request(app).get(`${routes.workbooks}/${targetWorkbook2.workbookId}`),
        ).expect(200);

        expect(response2.body).toStrictEqual({
            ...WORKBOOK_DEFAULT_FIELDS,
            workbookId: targetWorkbook2.workbookId,
            title: targetWorkbook2.title,
            collectionId: rootCollection.collectionId,
        });
    });

    test('Move to root', async () => {
        const response = await auth(request(app).post(routes.moveWorkbooks), {
            role: OpensourceRole.Editor,
        })
            .send({
                collectionId: null,
                workbookIds: [targetWorkbook.workbookId, targetWorkbook2.workbookId],
            })
            .expect(200);

        expect(response.body).toStrictEqual({
            workbooks: expect.arrayContaining([
                {
                    ...WORKBOOK_DEFAULT_FIELDS,
                    workbookId: targetWorkbook.workbookId,
                    title: targetWorkbook.title,
                    collectionId: null,
                },
                {
                    ...WORKBOOK_DEFAULT_FIELDS,
                    workbookId: targetWorkbook2.workbookId,
                    title: targetWorkbook2.title,
                    collectionId: null,
                },
            ]),
        });
    });
});
