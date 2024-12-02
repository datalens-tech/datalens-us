import request from 'supertest';

import {WORKBOOK_DEFAULT_FIELDS} from '../../../../models';
import {routes} from '../../../../routes';
import {US_ERRORS, app, auth, getWorkbookBinding} from '../../auth';
import {createMockWorkbook} from '../../helpers';

const rootWorkbook = {
    workbookId: '',
    title: 'Empty root workbook',
};

const rootWorkbook2 = {
    workbookId: '',
    title: 'Empty root workbook 2',
};

describe('Setup', () => {
    test('Create workbooks', async () => {
        const workbook = await createMockWorkbook({
            title: rootWorkbook.title,
            collectionId: null,
        });
        rootWorkbook.workbookId = workbook.workbookId;

        const workbook2 = await createMockWorkbook({
            title: rootWorkbook2.title,
            collectionId: null,
        });
        rootWorkbook2.workbookId = workbook2.workbookId;
    });
});

describe('Get workbooks by ids', () => {
    test('Auth error', async () => {
        await request(app)
            .post(routes.getWorkbooksListByIds)
            .send({
                workbookIds: [rootWorkbook.workbookId, rootWorkbook2.workbookId],
            })
            .expect(401);
    });

    test('Get list without permissions, should return empty list', async () => {
        const response = await auth(request(app).post(routes.getWorkbooksListByIds))
            .send({
                workbookIds: [rootWorkbook.workbookId, rootWorkbook2.workbookId],
            })
            .expect(200);

        expect(response.body).toStrictEqual([]);
    });

    test('Get list with permission only 1 workbook, should return 1 workbook', async () => {
        const response = await auth(request(app).post(routes.getWorkbooksListByIds), {
            accessBindings: [getWorkbookBinding(rootWorkbook.workbookId, 'limitedView')],
        })
            .send({
                workbookIds: [rootWorkbook.workbookId, rootWorkbook2.workbookId],
            })
            .expect(200);

        expect(response.body).toStrictEqual([
            {
                ...WORKBOOK_DEFAULT_FIELDS,
                workbookId: rootWorkbook.workbookId,
            },
        ]);
    });

    test('Get list without ids, should be a validation error', async () => {
        const response = await auth(request(app).post(routes.getWorkbooksListByIds), {
            accessBindings: [
                getWorkbookBinding(rootWorkbook.workbookId, 'limitedView'),
                getWorkbookBinding(rootWorkbook2.workbookId, 'limitedView'),
            ],
        }).expect(400);

        expect(response.body.code).toBe(US_ERRORS.VALIDATION_ERROR);
    });

    test('Successfully get list by ids', async () => {
        const response = await auth(request(app).post(routes.getWorkbooksListByIds), {
            accessBindings: [
                getWorkbookBinding(rootWorkbook.workbookId, 'limitedView'),
                getWorkbookBinding(rootWorkbook2.workbookId, 'limitedView'),
            ],
        })
            .send({
                workbookIds: [rootWorkbook.workbookId, rootWorkbook2.workbookId],
            })
            .expect(200);

        expect(response.body).toStrictEqual([
            {
                ...WORKBOOK_DEFAULT_FIELDS,
                workbookId: rootWorkbook.workbookId,
            },
            {
                ...WORKBOOK_DEFAULT_FIELDS,
                workbookId: rootWorkbook2.workbookId,
            },
        ]);
    });
});
