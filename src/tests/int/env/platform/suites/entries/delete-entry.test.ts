import request from 'supertest';

import {routes} from '../../../../routes';
import {app, auth, getWorkbookBinding} from '../../auth';
import {createMockWorkbook, createMockWorkbookEntry} from '../../helpers';

let workbookId: string;
let workbookEntryId: string;

const notExistingEntryId = 'fvsb9zbfkqos2';

describe('Delete entry', () => {
    beforeAll(async () => {
        const workbook = await createMockWorkbook({title: 'Workbook for deletion'});
        workbookId = workbook.workbookId;

        const workbookEntry = await createMockWorkbookEntry({
            name: 'Entry for deletion',
            workbookId: workbook.workbookId,
            scope: 'dash',
            type: 'wizard-widget',
        });

        workbookEntryId = workbookEntry.entryId;
    });

    test('Delete entry without auth error', async () => {
        await request(app).delete(`${routes.entries}/${workbookEntryId}`).expect(401);
    });

    test('Delete non-existing entry error', async () => {
        await auth(request(app).delete(`${routes.entries}/${notExistingEntryId}`), {
            accessBindings: [
                getWorkbookBinding(workbookId, 'limitedView'),
                getWorkbookBinding(workbookId, 'view'),
                getWorkbookBinding(workbookId, 'update'),
            ],
        }).expect(404);
    });

    test('Delete entry with read-only permissions error', async () => {
        await auth(request(app).delete(`${routes.entries}/${workbookEntryId}`), {
            accessBindings: [
                getWorkbookBinding(workbookId, 'limitedView'),
                getWorkbookBinding(workbookId, 'view'),
            ],
        }).expect(403);
    });

    test('Delete entry with wrong filter by scope. Entry is not found', async () => {
        await auth(
            request(app).delete(`${routes.entries}/${workbookEntryId}`).query({
                scope: 'dataset',
            }),
            {
                accessBindings: [
                    getWorkbookBinding(workbookId, 'limitedView'),
                    getWorkbookBinding(workbookId, 'view'),
                    getWorkbookBinding(workbookId, 'update'),
                ],
            },
        ).expect(404);
    });

    test('Delete entry with wrong filter by types. Entry is not found', async () => {
        await auth(
            request(app)
                .delete(`${routes.entries}/${workbookEntryId}`)
                .query({
                    types: ['wizard-chart', 'wizard-node'],
                }),
            {
                accessBindings: [
                    getWorkbookBinding(workbookId, 'limitedView'),
                    getWorkbookBinding(workbookId, 'view'),
                    getWorkbookBinding(workbookId, 'update'),
                ],
            },
        ).expect(404);
    });

    test('Successfully delete entry with filters by scope and types', async () => {
        const newEntry = await createMockWorkbookEntry({
            name: 'Entry for scope and types test',
            workbookId: workbookId,
            scope: 'dash',
            type: 'wizard-widget',
        });

        const response = await auth(
            request(app)
                .delete(`${routes.entries}/${newEntry.entryId}`)
                .query({
                    scope: 'dash',
                    types: ['wizard-widget'],
                }),
            {
                accessBindings: [
                    getWorkbookBinding(workbookId, 'limitedView'),
                    getWorkbookBinding(workbookId, 'view'),
                    getWorkbookBinding(workbookId, 'update'),
                ],
            },
        ).expect(200);

        expect(response.body.isDeleted).toBe(true);
    });

    test('Successfully delete entry', async () => {
        const response = await auth(request(app).delete(`${routes.entries}/${workbookEntryId}`), {
            accessBindings: [
                getWorkbookBinding(workbookId, 'limitedView'),
                getWorkbookBinding(workbookId, 'view'),
                getWorkbookBinding(workbookId, 'update'),
            ],
        }).expect(200);

        expect(response.body.isDeleted).toBe(true);

        await auth(request(app).get(`${routes.entries}/${workbookEntryId}`), {
            accessBindings: [
                getWorkbookBinding(workbookId, 'limitedView'),
                getWorkbookBinding(workbookId, 'view'),
                getWorkbookBinding(workbookId, 'update'),
            ],
        }).expect(404);
    });

    test('Recover deleted entry', async () => {
        const response = await auth(request(app).post(`${routes.entries}/${workbookEntryId}`), {
            accessBindings: [
                getWorkbookBinding(workbookId, 'limitedView'),
                getWorkbookBinding(workbookId, 'view'),
                getWorkbookBinding(workbookId, 'update'),
            ],
        })
            .send({
                mode: 'recover',
            })
            .expect(200);

        expect(response.body.isDeleted).toBeFalsy();

        await auth(request(app).get(`${routes.entries}/${workbookEntryId}`), {
            accessBindings: [
                getWorkbookBinding(workbookId, 'limitedView'),
                getWorkbookBinding(workbookId, 'view'),
            ],
        }).expect(200);
    });
});
