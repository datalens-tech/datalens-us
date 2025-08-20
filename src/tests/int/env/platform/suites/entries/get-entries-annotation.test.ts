import request from 'supertest';

import {routes} from '../../../../routes';
import {app, auth, getWorkbookBinding} from '../../auth';
import {createMockWorkbook, createMockWorkbookEntry} from '../../helpers';

let workbookId: string;
let workbookEntryId: string;
const workbook1EntryAnnotation = {
    description: 'workbook1 test 1',
};

let workbook2Id: string;
let workbook2EntryId: string;

const workbook2EntryAnnotation = {
    description: 'workbook2 test 1',
};

const notExistingEntryId = 'fvsb9zbfkqos2';

const ACCESS_DENIED_ERROR = {
    code: 'ACCESS_DENIED',
};
const NOT_FOUND_ERROR = {
    code: 'NOT_FOUND',
};

describe('Get entries annotation', () => {
    test('[Setup test data] Create workbook and entry', async () => {
        const workbook = await createMockWorkbook({title: 'My workbook'});

        workbookId = workbook.workbookId;

        const workbookEntry = await createMockWorkbookEntry({
            name: 'Workbook entry',
            workbookId: workbook.workbookId,
            scope: 'dash',
            type: 'wizard-widget',
            description: workbook1EntryAnnotation.description,
        });

        workbookEntryId = workbookEntry.entryId;

        expect(workbookEntry.annotation).toEqual(workbook1EntryAnnotation);
    });

    test('[Setup test data] Create workbook2 and entry', async () => {
        const workbook = await createMockWorkbook({title: 'My workbook 2'});

        workbook2Id = workbook.workbookId;

        const workbookEntry = await createMockWorkbookEntry({
            name: 'Workbook entry',
            workbookId: workbook.workbookId,
            scope: 'dash',
            type: 'wizard-widget',
            description: workbook2EntryAnnotation.description,
        });

        workbook2EntryId = workbookEntry.entryId;

        expect(workbookEntry.annotation).toEqual(workbook2EntryAnnotation);
    });

    test('Get entry annotation without auth error', async () => {
        await request(app).post(routes.getEntriesAnnotation).expect(401);
    });

    test('Get folder entry annotation validation error', async () => {
        await auth(request(app).post(routes.getEntriesAnnotation), {
            accessBindings: [getWorkbookBinding(workbookId, 'limitedView')],
        })
            .send({
                scope: 'dash',
                type: 'wizard-widget',
            })
            .expect(400);
    });

    test('Get workbook entry annotation, not existing entry annotation and access denied workbook entry annotation', async () => {
        const response = await auth(request(app).post(routes.getEntriesAnnotation), {
            accessBindings: [getWorkbookBinding(workbookId, 'limitedView')],
        })
            .send({
                entryIds: [workbookEntryId, notExistingEntryId, workbook2EntryId],
            })
            .expect(200);

        expect(response.body).toStrictEqual([
            {
                entryId: workbookEntryId,
                result: {
                    annotation: workbook1EntryAnnotation,
                    scope: 'dash',
                    type: 'wizard-widget',
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

    test('Get annotation of entries from different workbooks', async () => {
        const response = await auth(request(app).post(routes.getEntriesAnnotation), {
            accessBindings: [
                getWorkbookBinding(workbookId, 'limitedView'),
                getWorkbookBinding(workbook2Id, 'limitedView'),
            ],
        })
            .send({
                entryIds: [workbookEntryId, workbook2EntryId],
            })
            .expect(200);

        expect(response.body).toStrictEqual([
            {
                entryId: workbookEntryId,
                result: {
                    annotation: workbook1EntryAnnotation,
                    scope: 'dash',
                    type: 'wizard-widget',
                },
            },
            {
                entryId: workbook2EntryId,
                result: {
                    annotation: workbook2EntryAnnotation,
                    scope: 'dash',
                    type: 'wizard-widget',
                },
            },
        ]);
    });
});
