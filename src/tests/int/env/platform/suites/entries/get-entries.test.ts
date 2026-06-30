import request from 'supertest';

import {routes} from '../../../../routes';
import {app, auth, getWorkbookBinding} from '../../auth';
import {createMockWorkbook, createMockWorkbookEntry} from '../../helpers';

describe('Get entries', () => {
    let workbookId: string;
    let entryId1: string;
    let entryId2: string;

    beforeAll(async () => {
        const workbook = await createMockWorkbook({title: 'Get entries test workbook'});
        workbookId = workbook.workbookId;

        const [entry1, entry2] = await Promise.all([
            createMockWorkbookEntry({
                name: 'Get entries test entry 1',
                workbookId,
                scope: 'widget',
                type: 'graph_wizard_node',
            }),
            createMockWorkbookEntry({
                name: 'Get entries test entry 2',
                workbookId,
                scope: 'widget',
                type: 'graph_wizard_node',
            }),
        ]);

        entryId1 = entry1.entryId;
        entryId2 = entry2.entryId;
    });

    test('Returns 401 without auth', async () => {
        await request(app).get(routes.entries).query({scope: 'widget'}).expect(401);
    });

    test('Returns 400 when neither scope nor ids provided', async () => {
        await auth(request(app).get(routes.entries), {
            accessBindings: [getWorkbookBinding(workbookId, 'limitedView')],
        }).expect(400);
    });

    test('Returns entries filtered by ids', async () => {
        const {body} = await auth(request(app).get(routes.entries), {
            accessBindings: [getWorkbookBinding(workbookId, 'limitedView')],
        })
            .query({ids: [entryId1, entryId2]})
            .expect(200);

        expect(body.entries).toHaveLength(2);
        const returnedIds = body.entries.map((e: {entryId: string}) => e.entryId);
        expect(returnedIds).toEqual(expect.arrayContaining([entryId1, entryId2]));
    });

    test('Returns entries filtered by scope', async () => {
        const {body} = await auth(request(app).get(routes.entries), {
            accessBindings: [getWorkbookBinding(workbookId, 'limitedView')],
        })
            .query({ids: [entryId1, entryId2], scope: 'widget'})
            .expect(200);

        expect(body.entries).toHaveLength(2);
        body.entries.forEach((entry: {scope: string}) => {
            expect(entry.scope).toBe('widget');
        });
    });

    test('Returns empty list for non-matching scope filter', async () => {
        const {body} = await auth(request(app).get(routes.entries), {
            accessBindings: [getWorkbookBinding(workbookId, 'limitedView')],
        })
            .query({ids: [entryId1, entryId2], scope: 'dataset'})
            .expect(200);

        expect(body.entries).toHaveLength(0);
    });

    test('Returns entries with pagination', async () => {
        const {body: page1} = await auth(request(app).get(routes.entries), {
            accessBindings: [getWorkbookBinding(workbookId, 'limitedView')],
        })
            .query({ids: [entryId1, entryId2], pageSize: 1})
            .expect(200);

        expect(page1.entries).toHaveLength(1);

        const {body: page2} = await auth(request(app).get(routes.entries), {
            accessBindings: [getWorkbookBinding(workbookId, 'limitedView')],
        })
            .query({ids: [entryId1, entryId2], pageSize: 1, page: 1})
            .expect(200);

        expect(page2.entries).toHaveLength(1);
        expect(page2.entries[0].entryId).not.toBe(page1.entries[0].entryId);
    });
});
