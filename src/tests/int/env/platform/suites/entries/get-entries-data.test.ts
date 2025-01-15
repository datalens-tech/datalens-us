import request from 'supertest';

import {testOtherUserId} from '../../../../constants';
import {routes} from '../../../../routes';
import {app, auth, getWorkbookBinding} from '../../auth';
import {createMockEntry, createMockWorkbook, createMockWorkbookEntry} from '../../helpers';

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

let folderEntryId: string;
const folderEntryData = {
    shared: {
        inner: 'folder shared inner',
    },
    someArray: [6, 7, 8],
};

const ACCESS_DENIED_ERROR = {
    code: 'ACCESS_DENIED',
};
const NOT_FOUND_ERROR = {
    code: 'NOT_FOUND',
};

describe('Get entries data', () => {
    test('[Setup test data] Create folder entry', async () => {
        const entry = await createMockEntry({
            scope: 'dataset',
            type: 'graph',
            data: folderEntryData,
        });

        folderEntryId = entry.entryId;
    });

    test('Get folder entry data and not existing entry data', async () => {
        const response = await auth(request(app).post(routes.getEntriesData))
            .send({
                entryIds: [notExistingEntryId, folderEntryId],
                fields: ['shared.inner', 'someArray[0]', 'shared.notExistingfield'],
            })
            .expect(200);

        expect(response.body).toStrictEqual([
            {
                entryId: notExistingEntryId,
                error: NOT_FOUND_ERROR,
            },
            {
                entryId: folderEntryId,
                result: {
                    data: {
                        'shared.inner': folderEntryData.shared.inner,
                        'someArray[0]': folderEntryData.someArray[0],
                    },
                    scope: 'dataset',
                    type: 'graph',
                },
            },
        ]);
    });

    test('Get access denied folder entry data', async () => {
        const response = await auth(request(app).post(routes.getEntriesData), {
            userId: testOtherUserId,
        })
            .send({
                entryIds: [folderEntryId],
                fields: ['shared.inner'],
            })
            .expect(200);

        expect(response.body).toStrictEqual([
            {
                entryId: folderEntryId,
                error: ACCESS_DENIED_ERROR,
            },
        ]);
    });

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
