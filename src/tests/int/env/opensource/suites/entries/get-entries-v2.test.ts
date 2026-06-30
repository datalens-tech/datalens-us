import request from 'supertest';

import {routes} from '../../../../routes';
import {app, auth, authPrivateRoute} from '../../auth';
import {createMockWorkbook, createMockWorkbookEntry} from '../../helpers';
import {OpensourceRole} from '../../roles';

describe('Get entries v2', () => {
    let workbookId: string;
    let entryId1: string;
    let entryId2: string;
    let entryId3: string;
    let entryKey1: string;
    let entryKey2: string;
    let entryKey3: string;

    beforeAll(async () => {
        const workbook = await createMockWorkbook({title: 'Get entries test workbook'});
        workbookId = workbook.workbookId;

        const [entry1, entry2, entry3] = await Promise.all([
            createMockWorkbookEntry({
                name: 'test10',
                workbookId,
                scope: 'widget',
                type: 'graph_wizard_node',
            }),
            createMockWorkbookEntry({
                name: 'test1',
                workbookId,
                scope: 'widget',
                type: 'graph_wizard_node',
            }),
            createMockWorkbookEntry({
                name: 'test2',
                workbookId,
                scope: 'widget',
                type: 'graph_wizard_node',
            }),
        ]);

        entryId1 = entry1.entryId;
        entryId2 = entry2.entryId;
        entryId3 = entry3.entryId;
        entryKey1 = entry1.key;
        entryKey2 = entry2.key;
        entryKey3 = entry3.key;
    });

    test('Returns 401 without auth', async () => {
        await request(app).post(routes.getEntries).send({scope: 'widget'}).expect(401);
    });

    test('Returns 400 when neither scope nor ids provided', async () => {
        await auth(request(app).post(routes.getEntries)).expect(400);
    });

    test('Returns entries filtered by ids', async () => {
        const {body} = await auth(request(app).post(routes.getEntries), {
            role: OpensourceRole.Viewer,
        })
            .send({ids: [entryId1, entryId2, entryId3]})
            .expect(200);

        expect(body.entries).toHaveLength(3);
        const returnedIds = body.entries.map((e: {entryId: string}) => e.entryId);
        expect(returnedIds).toEqual(expect.arrayContaining([entryId1, entryId2, entryId3]));
    });

    test('Returns nextPageToken when more entries exist', async () => {
        const {body} = await auth(request(app).post(routes.getEntries), {
            role: OpensourceRole.Viewer,
        })
            .send({ids: [entryId1, entryId2, entryId3], pageSize: 2})
            .expect(200);

        expect(body.entries).toHaveLength(2);
        expect(body.nextPageToken).toBeDefined();
    });

    test('Returns no nextPageToken on last page', async () => {
        const {body} = await auth(request(app).post(routes.getEntries), {
            role: OpensourceRole.Viewer,
        })
            .send({ids: [entryId1, entryId2, entryId3]})
            .expect(200);

        expect(body.entries).toHaveLength(3);
        expect(body.nextPageToken).toBeUndefined();
    });

    test('Paginates through all entries without duplicates', async () => {
        const {body: page1} = await auth(request(app).post(routes.getEntries), {
            role: OpensourceRole.Viewer,
        })
            .send({ids: [entryId1, entryId2, entryId3], pageSize: 2})
            .expect(200);

        expect(page1.entries).toHaveLength(2);
        expect(page1.nextPageToken).toBeDefined();

        const {body: page2} = await auth(request(app).post(routes.getEntries), {
            role: OpensourceRole.Viewer,
        })
            .send({
                ids: [entryId1, entryId2, entryId3],
                pageSize: 2,
                pageToken: page1.nextPageToken,
            })
            .expect(200);

        expect(page2.entries).toHaveLength(1);
        expect(page2.nextPageToken).toBeUndefined();

        const allIds = [
            ...page1.entries.map((e: {entryId: string}) => e.entryId),
            ...page2.entries.map((e: {entryId: string}) => e.entryId),
        ];
        expect(new Set(allIds).size).toBe(3);
        expect(allIds).toEqual(expect.arrayContaining([entryId1, entryId2, entryId3]));
    });

    test('Paginates correctly with orderBy createdAt', async () => {
        const {body: page1} = await auth(request(app).post(routes.getEntries), {
            role: OpensourceRole.Viewer,
        })
            .send({
                ids: [entryId1, entryId2, entryId3],
                pageSize: 2,
                orderBy: {field: 'createdAt', direction: 'desc'},
            })
            .expect(200);

        expect(page1.entries).toHaveLength(2);
        expect(page1.nextPageToken).toBeDefined();

        const {body: page2} = await auth(request(app).post(routes.getEntries), {
            role: OpensourceRole.Viewer,
        })
            .send({
                ids: [entryId1, entryId2, entryId3],
                pageSize: 2,
                orderBy: {field: 'createdAt', direction: 'desc'},
                pageToken: page1.nextPageToken,
            })
            .expect(200);

        expect(page2.entries).toHaveLength(1);
        expect(page2.nextPageToken).toBeUndefined();

        const allIds = [
            ...page1.entries.map((e: {entryId: string}) => e.entryId),
            ...page2.entries.map((e: {entryId: string}) => e.entryId),
        ];
        expect(new Set(allIds).size).toBe(3);
    });

    test('Paginates correctly with orderBy name', async () => {
        const {body: page1} = await auth(request(app).post(routes.getEntries), {
            role: OpensourceRole.Viewer,
        })
            .send({
                ids: [entryId1, entryId2, entryId3],
                pageSize: 2,
                orderBy: {field: 'name', direction: 'asc'},
            })
            .expect(200);

        expect(page1.entries).toHaveLength(2);
        expect(page1.nextPageToken).toBeDefined();

        const {body: page2} = await auth(request(app).post(routes.getEntries), {
            role: OpensourceRole.Viewer,
        })
            .send({
                ids: [entryId1, entryId2, entryId3],
                pageSize: 2,
                orderBy: {field: 'name', direction: 'asc'},
                pageToken: page1.nextPageToken,
            })
            .expect(200);

        expect(page2.entries).toHaveLength(1);
        expect(page2.nextPageToken).toBeUndefined();

        const allEntries = [...page1.entries, ...page2.entries];

        // Natural sort order: test1, test2, test10
        const allKeys = allEntries.map((e: {key: string}) => e.key);
        expect(allKeys).toEqual([entryKey2, entryKey3, entryKey1]);
    });

    describe('private endpoint', () => {
        test('Returns 403 without master token', async () => {
            await request(app)
                .post(routes.privateGetEntries)
                .send({ids: [entryId1]})
                .expect(403);
        });

        test('Returns 200 with master token', async () => {
            const {body} = await authPrivateRoute(request(app).post(routes.privateGetEntries))
                .send({ids: [entryId1, entryId2, entryId3]})
                .expect(200);

            expect(body.entries).toHaveLength(3);
        });
    });
});
