import request from 'supertest';

import {routes} from '../../../../routes';
import {app, auth, authPrivateRoute, testTenantId} from '../../auth';
import {createMockWorkbook, createMockWorkbookEntry} from '../../helpers';

let workbookId: string;

let connectionId: string;
let datasetId: string;
let widgetId: string;
let dashId: string;

const commonExpect = {
    key: null,
    createdAt: expect.any(String),
    public: false,
    tenantId: testTenantId,
    collectionId: null,
    isLocked: false,
};

describe('Get entries relations', () => {
    test('[Setup test data] Create workbook and entries with links', async () => {
        const workbook = await createMockWorkbook({title: 'My workbook'});

        workbookId = workbook.workbookId;

        const connectionEntry = await createMockWorkbookEntry({
            name: 'Workbook connection',
            workbookId: workbookId,
            scope: 'connection',
            type: 'connection-type',
        });

        connectionId = connectionEntry.entryId;

        const datasetEntry = await createMockWorkbookEntry({
            name: 'Workbook dataset',
            workbookId: workbookId,
            scope: 'dataset',
            type: 'dataset-type',
            links: {
                [connectionId]: connectionId,
            },
        });

        datasetId = datasetEntry.entryId;

        const widgetEntry = await createMockWorkbookEntry({
            name: 'Workbook widget',
            workbookId: workbookId,
            scope: 'widget',
            type: 'widget-type',
        });

        widgetId = widgetEntry.entryId;

        const dashEntry = await createMockWorkbookEntry({
            name: 'Workbook dash',
            workbookId: workbookId,
            scope: 'dash',
            type: 'dash-type',
            links: {
                [widgetId]: widgetId,
                [datasetId]: datasetId,
            },
        });

        dashId = dashEntry.entryId;
    });

    test('Get entries relations auth error', async () => {
        await request(app)
            .post(routes.getEntriesRelations)
            .send({
                entryIds: [dashId],
            })
            .expect(401);
    });

    test('Get children entries relations by entryIds', async () => {
        const response = await auth(request(app).post(routes.getEntriesRelations))
            .send({
                entryIds: [dashId],
            })
            .expect(200);

        expect(response.body).toStrictEqual({
            relations: [
                {
                    ...commonExpect,
                    entryId: datasetId,
                    scope: 'dataset',
                    type: 'dataset-type',
                    workbookId: workbookId,
                },
                {
                    ...commonExpect,
                    entryId: widgetId,
                    scope: 'widget',
                    type: 'widget-type',
                    workbookId: workbookId,
                },
            ],
        });
    });

    test('Get parent entries relations by entryIds', async () => {
        const response = await auth(request(app).post(routes.getEntriesRelations))
            .send({
                entryIds: [connectionId, widgetId],
                linkDirection: 'to',
            })
            .expect(200);

        expect(response.body).toStrictEqual({
            relations: [
                {
                    ...commonExpect,
                    entryId: datasetId,
                    scope: 'dataset',
                    type: 'dataset-type',
                    workbookId: workbookId,
                },
                {
                    ...commonExpect,
                    entryId: dashId,
                    scope: 'dash',
                    type: 'dash-type',
                    workbookId: workbookId,
                },
            ],
        });
    });

    test('Get entries relations filtered by scope', async () => {
        const response = await auth(request(app).post(routes.getEntriesRelations))
            .send({
                entryIds: [dashId],
                scope: 'widget',
            })
            .expect(200);

        expect(response.body).toStrictEqual({
            relations: [
                {
                    ...commonExpect,
                    entryId: widgetId,
                    scope: 'widget',
                    type: 'widget-type',
                    workbookId: workbookId,
                },
            ],
        });
    });

    test('Get entries relations with pagination', async () => {
        const response1 = await auth(request(app).post(routes.getEntriesRelations))
            .send({
                entryIds: [dashId],
                limit: 1,
            })
            .expect(200);

        expect(response1.body).toStrictEqual({
            relations: [
                {
                    ...commonExpect,
                    entryId: datasetId,
                    scope: 'dataset',
                    type: 'dataset-type',
                    workbookId: workbookId,
                },
            ],
            nextPageToken: expect.any(String),
        });

        const response2 = await auth(request(app).post(routes.getEntriesRelations))
            .send({
                entryIds: [dashId],
                limit: 1,
                pageToken: response1.body.nextPageToken,
            })
            .expect(200);

        expect(response2.body).toStrictEqual({
            relations: [
                {
                    ...commonExpect,
                    entryId: widgetId,
                    scope: 'widget',
                    type: 'widget-type',
                    workbookId: workbookId,
                },
            ],
        });
    });

    test('Get entries relations with permissions info', async () => {
        const response = await auth(request(app).post(routes.getEntriesRelations))
            .send({
                entryIds: [dashId],
                includePermissionsInfo: true,
            })
            .expect(200);

        expect(response.body).toStrictEqual({
            relations: [
                {
                    ...commonExpect,
                    entryId: datasetId,
                    scope: 'dataset',
                    type: 'dataset-type',
                    workbookId: workbookId,

                    permissions: {
                        admin: false,
                        edit: false,
                        execute: true,
                        read: true,
                    },
                },
                {
                    ...commonExpect,
                    entryId: widgetId,
                    scope: 'widget',
                    type: 'widget-type',
                    workbookId: workbookId,
                    permissions: {
                        admin: false,
                        edit: false,
                        execute: true,
                        read: true,
                    },
                },
            ],
        });
    });

    test('Private endpoint. Get entries relations auth error', async () => {
        await request(app)
            .post(routes.privateGetEntriesRelations)
            .send({
                entryIds: [dashId],
            })
            .expect(403);
    });

    test('Private endpoint. Get entries relations successful', async () => {
        await authPrivateRoute(request(app).post(routes.privateGetEntriesRelations))
            .send({
                entryIds: [dashId],
            })
            .expect(200);
    });
});
