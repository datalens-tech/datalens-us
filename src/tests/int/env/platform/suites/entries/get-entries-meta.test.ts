import request from 'supertest';

import {routes} from '../../../../routes';
import {app, auth, getWorkbookBinding} from '../../auth';
import {createMockWorkbook, createMockWorkbookEntry} from '../../helpers';

let workbookId: string;
let workbookEntryId: string;
const workbookEntryMeta = {
    test1: 'test 1',
    test2: 'test 2',
};

let workbook2Id: string;
let workbook2EntryId: string;
const workbook2EntryMeta = {
    test1: 'workbook2 test 1',
    test2: 'workbook2 test 2',
};

const notExistingEntryId = 'fvsb9zbfkqos2';

const ACCESS_DENIED_ERROR = {
    code: 'ACCESS_DENIED',
};
const NOT_FOUND_ERROR = {
    code: 'NOT_FOUND',
};

describe('Get entries meta', () => {
    test('[Setup test data] Create workbook and entry', async () => {
        const workbook = await createMockWorkbook({title: 'My workbook'});

        workbookId = workbook.workbookId;

        const worbookEntry = await createMockWorkbookEntry({
            name: 'Workbook entry',
            workbookId: workbook.workbookId,
            scope: 'dataset',
            type: 'wizard-dataset',
            meta: workbookEntryMeta,
        });

        workbookEntryId = worbookEntry.entryId;
    });

    test('[Setup test data] Create workbook2 and entry', async () => {
        const workbook = await createMockWorkbook({title: 'My workbook 2'});

        workbook2Id = workbook.workbookId;

        const worbookEntry = await createMockWorkbookEntry({
            name: 'Workbook entry',
            workbookId: workbook.workbookId,
            scope: 'widget',
            type: 'wizard-widget',
            meta: workbook2EntryMeta,
        });

        workbook2EntryId = worbookEntry.entryId;
    });

    test('Get entry meta without auth error', async () => {
        await request(app).post(routes.getEntriesMeta).expect(401);
    });

    test('Get entry meta validation error', async () => {
        await auth(request(app).post(routes.getEntriesMeta), {
            accessBindings: [getWorkbookBinding(workbookId, 'limitedView')],
        })
            .send({
                entryIds: [workbookEntryId, notExistingEntryId, workbook2EntryId],
                fields: ['test.test', 'test2', 'notExistingfield'],
            })
            .expect(400);

        await auth(request(app).post(routes.getEntriesMeta), {
            accessBindings: [getWorkbookBinding(workbookId, 'limitedView')],
        })
            .send({
                entryIds: [workbookEntryId, notExistingEntryId, workbook2EntryId],
                fields: ['test[0]', 'test2', 'notExistingfield'],
            })
            .expect(400);
    });

    test('Get workbook entry meta, not existing entry meta and access denied workbook entry meta', async () => {
        const response = await auth(request(app).post(routes.getEntriesMeta), {
            accessBindings: [getWorkbookBinding(workbookId, 'limitedView')],
        })
            .send({
                entryIds: [workbookEntryId, notExistingEntryId, workbook2EntryId],
                fields: ['test1', 'test2', 'notExistingfield'],
            })
            .expect(200);

        expect(response.body).toStrictEqual([
            {
                entryId: workbookEntryId,
                result: {
                    meta: {
                        test1: workbookEntryMeta.test1,
                        test2: workbookEntryMeta.test2,
                    },
                    scope: 'dataset',
                    type: 'wizard-dataset',
                },
            },
            {
                entryId: notExistingEntryId,
                error: NOT_FOUND_ERROR,
            },
            {
                entryId: workbook2EntryId,
                error: ACCESS_DENIED_ERROR,
            },
        ]);
    });

    test('Get meta of entries from different workbooks', async () => {
        const response = await auth(request(app).post(routes.getEntriesMeta), {
            accessBindings: [
                getWorkbookBinding(workbookId, 'limitedView'),
                getWorkbookBinding(workbook2Id, 'limitedView'),
            ],
        })
            .send({
                entryIds: [workbookEntryId, workbook2EntryId],
                fields: ['test1', 'test2', 'notExistingfield'],
            })
            .expect(200);

        expect(response.body).toStrictEqual([
            {
                entryId: workbookEntryId,
                result: {
                    meta: {
                        test1: workbookEntryMeta.test1,
                        test2: workbookEntryMeta.test2,
                    },
                    scope: 'dataset',
                    type: 'wizard-dataset',
                },
            },
            {
                entryId: workbook2EntryId,
                result: {
                    meta: {
                        test1: workbook2EntryMeta.test1,
                        test2: workbook2EntryMeta.test2,
                    },
                    scope: 'widget',
                    type: 'wizard-widget',
                },
            },
        ]);
    });
});
