import request from 'supertest';

import {routes} from '../../../../routes';
import {app, auth} from '../../auth';
import {createMockWorkbook, createMockWorkbookEntry} from '../../helpers';
import {OpensourceRole} from '../../roles';

const notExistingEntryId = 'fvsb9zbfkqos2';

describe('Update entry', () => {
    let workbookId: string;
    let entryId: string;

    beforeAll(async () => {
        const workbook = await createMockWorkbook({title: 'Update entry test workbook'});
        workbookId = workbook.workbookId;

        const entry = await createMockWorkbookEntry({
            name: 'Update entry test',
            workbookId,
            scope: 'widget',
            type: 'graph_wizard_node',
        });
        entryId = entry.entryId;
    });

    test('Returns 401 without auth', async () => {
        await request(app)
            .post(`${routes.entries}/${entryId}`)
            .send({data: {v: 2}})
            .expect(401);
    });

    test('Returns 403 with Viewer role', async () => {
        await auth(request(app).post(`${routes.entries}/${entryId}`), {
            role: OpensourceRole.Viewer,
        })
            .send({data: {v: 2}})
            .expect(403);
    });

    test('Returns 404 for non-existing entry', async () => {
        await auth(request(app).post(`${routes.entries}/${notExistingEntryId}`), {
            role: OpensourceRole.Editor,
        })
            .send({data: {v: 2}})
            .expect(404);
    });

    test('Successfully updates entry data', async () => {
        const newData = {version: 2, value: 'updated'};

        const {body} = await auth(request(app).post(`${routes.entries}/${entryId}`), {
            role: OpensourceRole.Editor,
        })
            .send({data: newData, mode: 'save'})
            .expect(200);

        expect(body.entryId).toBe(entryId);
        expect(body.data).toEqual(newData);
    });

    test('Successfully updates entry meta', async () => {
        const newMeta = {key: 'value'};

        const {body} = await auth(request(app).post(`${routes.entries}/${entryId}`), {
            role: OpensourceRole.Editor,
        })
            .send({meta: newMeta})
            .expect(200);

        expect(body.entryId).toBe(entryId);
        expect(body.meta).toEqual(newMeta);
    });

    test('Successfully updates entry with description', async () => {
        const {body} = await auth(request(app).post(`${routes.entries}/${entryId}`), {
            role: OpensourceRole.Editor,
        })
            .send({description: 'test description'})
            .expect(200);

        expect(body.entryId).toBe(entryId);
    });

    test('Successfully resets entry type to an empty string', async () => {
        const {body: setBody} = await auth(request(app).post(`${routes.entries}/${entryId}`), {
            role: OpensourceRole.Editor,
        })
            .send({type: 'extract'})
            .expect(200);

        expect(setBody.type).toBe('extract');

        const {body: resetBody} = await auth(request(app).post(`${routes.entries}/${entryId}`), {
            role: OpensourceRole.Editor,
        })
            .send({type: ''})
            .expect(200);

        expect(resetBody.type).toBe('');
    });

    test('Returns 200 when recovering deleted entry', async () => {
        const entry = await createMockWorkbookEntry({
            name: 'Entry to delete and recover',
            workbookId,
            scope: 'widget',
            type: 'graph_wizard_node',
        });

        await auth(request(app).delete(`${routes.entries}/${entry.entryId}`), {
            role: OpensourceRole.Editor,
        }).expect(200);

        const {body} = await auth(request(app).post(`${routes.entries}/${entry.entryId}`), {
            role: OpensourceRole.Editor,
        })
            .send({mode: 'recover'})
            .expect(200);

        expect(body.isDeleted).toBeFalsy();
    });
});
