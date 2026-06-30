import request from 'supertest';

import {routes} from '../../../../routes';
import {app, auth, getWorkbookBinding} from '../../auth';
import {createMockWorkbook, createMockWorkbookEntry} from '../../helpers';

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

    test('Returns 403 without write permission', async () => {
        await auth(request(app).post(`${routes.entries}/${entryId}`), {
            accessBindings: [getWorkbookBinding(workbookId, 'limitedView')],
        })
            .send({data: {v: 2}})
            .expect(403);
    });

    test('Returns 404 for non-existing entry', async () => {
        await auth(request(app).post(`${routes.entries}/${notExistingEntryId}`), {
            accessBindings: [
                getWorkbookBinding(workbookId, 'limitedView'),
                getWorkbookBinding(workbookId, 'update'),
            ],
        })
            .send({data: {v: 2}})
            .expect(404);
    });

    test('Successfully updates entry data', async () => {
        const newData = {version: 2, value: 'updated'};

        const {body} = await auth(request(app).post(`${routes.entries}/${entryId}`), {
            accessBindings: [
                getWorkbookBinding(workbookId, 'limitedView'),
                getWorkbookBinding(workbookId, 'update'),
            ],
        })
            .send({data: newData, mode: 'save'})
            .expect(200);

        expect(body.entryId).toBe(entryId);
        expect(body.data).toEqual(newData);
    });

    test('Successfully updates entry meta', async () => {
        const newMeta = {key: 'value'};

        const {body} = await auth(request(app).post(`${routes.entries}/${entryId}`), {
            accessBindings: [
                getWorkbookBinding(workbookId, 'limitedView'),
                getWorkbookBinding(workbookId, 'update'),
            ],
        })
            .send({meta: newMeta})
            .expect(200);

        expect(body.entryId).toBe(entryId);
        expect(body.meta).toEqual(newMeta);
    });
});
