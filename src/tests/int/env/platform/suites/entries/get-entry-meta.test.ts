import request from 'supertest';

import {routes} from '../../../../routes';
import {US_ERRORS, app, auth, authPrivateRoute, getWorkbookBinding} from '../../auth';
import {createMockWorkbook, createMockWorkbookEntry} from '../../helpers';

const entryMetaRoute = routes.getEntryMetaRoute;
const privateEntryMetaRoute = routes.getPrivateEntryMetaRoute;

let workbookId: string;
let workbookEntryId: string;
const workbookEntryMeta = {
    test1: 'test 1',
    test2: 'test 2',
};

let workbook2Id: string;
let workbook2EntryId: string;

const notExistingEntryId = 'fvsb9zbfkqos2';

describe('Get entry meta', () => {
    beforeAll(async () => {
        const workbook1 = await createMockWorkbook({title: 'Get entry meta workbook'});

        workbookId = workbook1.workbookId;

        const workbook1Entry = await createMockWorkbookEntry({
            name: 'Entry for meta test',
            workbookId: workbook1.workbookId,
            scope: 'dataset',
            type: 'wizard-dataset',
            meta: workbookEntryMeta,
        });

        workbookEntryId = workbook1Entry.entryId;

        const workbook2 = await createMockWorkbook({title: 'Get entry meta workbook 2'});

        workbook2Id = workbook2.workbookId;

        const workbook2Entry = await createMockWorkbookEntry({
            name: 'Entry for meta test 2',
            workbookId: workbook2.workbookId,
            scope: 'widget',
            type: 'wizard-widget',
        });

        workbook2EntryId = workbook2Entry.entryId;
    });

    test('Get entry meta without auth - should return 401', async () => {
        await request(app).get(entryMetaRoute(workbookEntryId)).expect(401);
    });

    test('Get entry meta for non-existing entry - should return error', async () => {
        const response = await auth(request(app).get(entryMetaRoute(notExistingEntryId)), {
            accessBindings: [getWorkbookBinding(workbookId, 'limitedView')],
        }).expect(404);

        expect(response.body.code).toBe(US_ERRORS.NOT_EXIST_ENTRY);
    });

    test('Get entry meta without workbook access - should return 403', async () => {
        await auth(request(app).get(entryMetaRoute(workbookEntryId)), {
            accessBindings: [getWorkbookBinding(workbook2Id, 'limitedView')],
        }).expect(403);
    });

    test('Get entry meta with access - should return meta', async () => {
        const response = await auth(request(app).get(entryMetaRoute(workbookEntryId)), {
            accessBindings: [getWorkbookBinding(workbookId, 'limitedView')],
        }).expect(200);

        expect(response.body).toMatchObject({
            entryId: workbookEntryId,
            scope: 'dataset',
            type: 'wizard-dataset',
            meta: workbookEntryMeta,
            workbookId: workbookId,
        });

        expect(response.body).toHaveProperty('savedId');
        expect(response.body).toHaveProperty('publishedId');
        expect(response.body).toHaveProperty('key');
        expect(response.body).toHaveProperty('tenantId');
    });

    test('Get entry meta with branch=saved query param', async () => {
        const response = await auth(
            request(app).get(entryMetaRoute(workbookEntryId)).query({branch: 'saved'}),
            {
                accessBindings: [getWorkbookBinding(workbookId, 'limitedView')],
            },
        ).expect(200);

        expect(response.body).toMatchObject({
            entryId: workbookEntryId,
            scope: 'dataset',
            type: 'wizard-dataset',
            meta: workbookEntryMeta,
        });
    });

    test('Get entry meta from another workbook with correct access', async () => {
        const response = await auth(request(app).get(entryMetaRoute(workbook2EntryId)), {
            accessBindings: [getWorkbookBinding(workbook2Id, 'limitedView')],
        }).expect(200);

        expect(response.body).toMatchObject({
            entryId: workbook2EntryId,
            scope: 'widget',
            type: 'wizard-widget',
            workbookId: workbook2Id,
        });
    });

    test('Get entry meta via private route without private creds - should return 403', async () => {
        await auth(request(app).get(privateEntryMetaRoute(workbookEntryId)), {
            accessBindings: [getWorkbookBinding(workbookId, 'limitedView')],
        }).expect(403);
    });

    test('Get entry meta via private route - should not require auth', async () => {
        const response = await authPrivateRoute(
            request(app).get(privateEntryMetaRoute(workbookEntryId)),
        ).expect(200);

        expect(response.body).toMatchObject({
            entryId: workbookEntryId,
            scope: 'dataset',
            type: 'wizard-dataset',
            meta: workbookEntryMeta,
        });
    });
});
