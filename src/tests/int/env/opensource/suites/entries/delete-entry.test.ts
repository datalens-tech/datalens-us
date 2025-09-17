import request from 'supertest';

import {routes} from '../../../../routes';
import {app, auth} from '../../auth';
import {createMockWorkbook, createMockWorkbookEntry} from '../../helpers';
import {OpensourceRole} from '../../roles';

let workbookId: string;
let workbookEntryId: string;

const notExistingEntryId = 'fvsb9zbfkqos2';

describe('Delete entry', () => {
    test('[Setup test data] Create workbook and entry for deletion', async () => {
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
            role: OpensourceRole.Editor,
        }).expect(404);
    });

    test('Delete entry with read-only permissions error', async () => {
        await auth(request(app).delete(`${routes.entries}/${workbookEntryId}`), {
            role: OpensourceRole.Viewer,
        }).expect(403);
    });

    test('Delete entry with wrong filter by scope. Entry is not found', async () => {
        await auth(
            request(app).delete(`${routes.entries}/${workbookEntryId}`).query({
                scope: 'dataset',
            }),
            {
                role: OpensourceRole.Editor,
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
                role: OpensourceRole.Editor,
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
                role: OpensourceRole.Editor,
            },
        ).expect(200);

        expect(response.body.isDeleted).toBe(true);
    });

    test('Successfully delete entry', async () => {
        const response = await auth(request(app).delete(`${routes.entries}/${workbookEntryId}`), {
            role: OpensourceRole.Editor,
        }).expect(200);

        expect(response.body.isDeleted).toBe(true);

        await auth(request(app).get(`${routes.entries}/${workbookEntryId}`), {
            role: OpensourceRole.Editor,
        }).expect(404);
    });

    test('Recover deleted entry', async () => {
        const response = await auth(request(app).post(`${routes.entries}/${workbookEntryId}`), {
            role: OpensourceRole.Editor,
        })
            .send({
                mode: 'recover',
            })
            .expect(200);

        expect(response.body.isDeleted).toBeFalsy();

        await auth(request(app).get(`${routes.entries}/${workbookEntryId}`), {
            role: OpensourceRole.Editor,
        }).expect(200);
    });
});
