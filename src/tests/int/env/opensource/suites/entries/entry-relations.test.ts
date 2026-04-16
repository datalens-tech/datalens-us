import request from 'supertest';

import {routes} from '../../../../routes';
import {app, auth, testTenantId} from '../../auth';
import {createMockWorkbook, createMockWorkbookEntry} from '../../helpers';

describe('Entry relations', () => {
    let connectionId: string;
    let datasetId: string;
    let workbookId: string;

    beforeAll(async () => {
        const workbook = await createMockWorkbook({title: 'Relations test workbook'});
        workbookId = workbook.workbookId;

        const connection = await createMockWorkbookEntry({
            name: 'Connection entry',
            workbookId,
            scope: 'connection',
            type: 'connection-type',
        });
        connectionId = connection.entryId;

        const dataset = await createMockWorkbookEntry({
            name: 'Dataset entry',
            workbookId,
            scope: 'dataset',
            type: 'dataset-type',
            links: {[connectionId]: connectionId},
        });
        datasetId = dataset.entryId;
    });

    test('Get relations auth error', async () => {
        await request(app).get(routes.entryRelations(datasetId)).expect(401);
    });

    test('Get parent relations (default direction)', async () => {
        const {body} = await auth(request(app).get(routes.entryRelations(datasetId))).expect(200);

        expect(body).toHaveLength(1);
        expect(body[0]).toMatchObject({
            entryId: connectionId,
            scope: 'connection',
            type: 'connection-type',
            workbookId,
            tenantId: testTenantId,
            public: false,
        });
    });

    test('Get parent relations with explicit direction', async () => {
        const {body} = await auth(request(app).get(routes.entryRelations(datasetId)))
            .query({direction: 'parent'})
            .expect(200);

        expect(body).toHaveLength(1);
        expect(body[0]).toMatchObject({
            entryId: connectionId,
            scope: 'connection',
        });
    });

    test('Get relations filtered by scope', async () => {
        const {body} = await auth(request(app).get(routes.entryRelations(datasetId)))
            .query({scope: 'connection'})
            .expect(200);

        expect(body).toHaveLength(1);
        expect(body[0].scope).toBe('connection');
    });

    test('Get relations filtered by non-matching scope returns empty list', async () => {
        const {body} = await auth(request(app).get(routes.entryRelations(datasetId)))
            .query({scope: 'dash'})
            .expect(200);

        expect(body).toHaveLength(0);
    });

    test('Get relations with pagination returns paginated result', async () => {
        const {body} = await auth(request(app).get(routes.entryRelations(datasetId)))
            .query({page: 0, pageSize: 10})
            .expect(200);

        expect(body).toMatchObject({
            relations: expect.arrayContaining([expect.objectContaining({entryId: connectionId})]),
        });
    });

    test('Get relations with permissions info', async () => {
        const {body} = await auth(request(app).get(routes.entryRelations(datasetId)))
            .query({includePermissionsInfo: 'true'})
            .expect(200);

        expect(body).toHaveLength(1);
        expect(body[0].permissions).toBeDefined();
    });

    test('Get relations for non-existing entry returns error', async () => {
        const notExistingEntryId = 'fvsb9zbfkqos2';

        await auth(request(app).get(routes.entryRelations(notExistingEntryId))).expect(404);
    });
});
