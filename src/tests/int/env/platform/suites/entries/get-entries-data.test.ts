import request from 'supertest';

import {routes} from '../../../../routes';
import {app, auth, getWorkbookBinding} from '../../auth';
import {createMockWorkbook, createMockWorkbookEntry} from '../../helpers';

let workbookId: string;
let workbookEntryId: string;
const workbookEntryData = {
    shared: {
        inner: 'shared inner',
    },
    someArray: [1, 2, 3],
};

let workbook2Id: string;
let workbook2EntryId: string;
const workbook2EntryData = {
    shared: {
        inner: 'another shared inner',
    },
    someArray: [3, 4, 5],
};

const notExistingEntryId = 'fvsb9zbfkqos2';

const ACCESS_DENIED_ERROR = {
    code: 'ACCESS_DENIED',
};
const NOT_FOUND_ERROR = {
    code: 'NOT_FOUND',
};

describe('Get entries data', () => {
    test('[Setup test data] Create workbook and entry', async () => {
        const workbook = await createMockWorkbook({title: 'My workbook'});

        workbookId = workbook.workbookId;

        const worbookEntry = await createMockWorkbookEntry({
            name: 'Workbook entry',
            workbookId: workbook.workbookId,
            scope: 'dataset',
            type: 'wizard-dataset',
            data: workbookEntryData,
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
            data: workbook2EntryData,
        });

        workbook2EntryId = worbookEntry.entryId;
    });

    test('Get workbook entry data, not existing entry data and access denied workbook entry data', async () => {
        const response = await auth(request(app).post(routes.getEntriesData), {
            accessBindings: [getWorkbookBinding(workbookId, 'limitedView')],
        })
            .send({
                entryIds: [workbookEntryId, notExistingEntryId, workbook2EntryId],
                fields: ['shared.inner', 'someArray[0]', 'shared.notExistingfield'],
            })
            .expect(200);

        expect(response.body).toStrictEqual([
            {
                entryId: workbookEntryId,
                result: {
                    data: {
                        'shared.inner': workbookEntryData.shared.inner,
                        'someArray[0]': workbookEntryData.someArray[0],
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

    test('Get data of entries from different workbooks', async () => {
        const response = await auth(request(app).post(routes.getEntriesData), {
            accessBindings: [
                getWorkbookBinding(workbookId, 'limitedView'),
                getWorkbookBinding(workbook2Id, 'limitedView'),
            ],
        })
            .send({
                entryIds: [workbookEntryId, workbook2EntryId],
                fields: ['shared.inner', 'someArray[0]', 'shared.notExistingfield'],
            })
            .expect(200);

        expect(response.body).toStrictEqual([
            {
                entryId: workbookEntryId,
                result: {
                    data: {
                        'shared.inner': workbookEntryData.shared.inner,
                        'someArray[0]': workbookEntryData.someArray[0],
                    },
                    scope: 'dataset',
                    type: 'wizard-dataset',
                },
            },
            {
                entryId: workbook2EntryId,
                result: {
                    data: {
                        'shared.inner': workbook2EntryData.shared.inner,
                        'someArray[0]': workbook2EntryData.someArray[0],
                    },
                    scope: 'widget',
                    type: 'wizard-widget',
                },
            },
        ]);
    });
});
