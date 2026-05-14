import request from 'supertest';

import {systemUserId} from '../../../../constants';
import {WORKBOOK_DEFAULT_FIELDS} from '../../../../models';
import {routes} from '../../../../routes';
import {app, authPrivateRoute} from '../../auth';

const workbooksData = [
    {
        id: '',
        title: 'All workbooks test title 1',
        description: 'All workbooks test description 1',
    },
    {
        id: '',
        title: 'All workbooks test title 2',
        description: 'All workbooks test description 2',
    },
];

describe('GET /private/all-workbooks', () => {
    beforeAll(async () => {
        for (const workbook of workbooksData) {
            const response = await authPrivateRoute(request(app).post(routes.privateWorkbooks))
                .send({title: workbook.title, description: workbook.description})
                .expect(200);
            workbook.id = response.body.workbookId;
        }
    });

    test('Get all workbooks without auth returns 403', async () => {
        await request(app).get(routes.allWorkbooks).expect(403);
    });

    test('Get all workbooks', async () => {
        const response = await authPrivateRoute(request(app).get(routes.allWorkbooks)).expect(200);

        const {body} = response;

        expect(body).toStrictEqual({
            workbooks: expect.arrayContaining([
                {
                    ...WORKBOOK_DEFAULT_FIELDS,
                    collectionId: null,
                    createdBy: systemUserId,
                    updatedBy: systemUserId,
                    description: workbooksData[0].description,
                    title: workbooksData[0].title,
                    workbookId: workbooksData[0].id,
                },
                {
                    ...WORKBOOK_DEFAULT_FIELDS,
                    collectionId: null,
                    createdBy: systemUserId,
                    updatedBy: systemUserId,
                    description: workbooksData[1].description,
                    title: workbooksData[1].title,
                    workbookId: workbooksData[1].id,
                },
            ]),
        });
    });

    test('Get all workbooks with pagination', async () => {
        const response1 = await authPrivateRoute(request(app).get(routes.allWorkbooks))
            .query({pageSize: 1})
            .expect(200);

        const {body: body1} = response1;

        expect(body1.workbooks).toHaveLength(1);
        expect(body1.nextPageToken).toEqual(expect.any(String));

        const response2 = await authPrivateRoute(request(app).get(routes.allWorkbooks))
            .query({page: body1.nextPageToken, pageSize: 1})
            .expect(200);

        const {body: body2} = response2;

        expect(body2.workbooks).toHaveLength(1);
        expect(body2.workbooks[0].workbookId).not.toBe(body1.workbooks[0].workbookId);
    });
});
