import request from 'supertest';

import {routes} from '../../../../routes';
import {app, auth} from '../../auth';
import {createMockWorkbook} from '../../helpers';
import {OpensourceRole} from '../../roles';

describe('Create entry', () => {
    let workbookId: string;

    beforeAll(async () => {
        const workbook = await createMockWorkbook({title: 'Create entry test workbook'});
        workbookId = workbook.workbookId;
    });

    test('Returns 401 without auth', async () => {
        await request(app)
            .post(routes.entries)
            .send({name: 'Test entry', scope: 'widget', type: 'graph_node', workbookId})
            .expect(401);
    });

    test('Returns 403 with Viewer role', async () => {
        await auth(request(app).post(routes.entries), {role: OpensourceRole.Viewer})
            .send({name: 'Test entry', scope: 'widget', type: 'graph_node', workbookId})
            .expect(403);
    });

    test('Successfully creates entry in workbook', async () => {
        const entryData = {version: 1, value: 'test'};
        const entryMeta = {key: 'value'};

        const {body} = await auth(request(app).post(routes.entries), {
            role: OpensourceRole.Editor,
        })
            .send({
                name: 'Test entry',
                scope: 'widget',
                type: 'graph_node',
                workbookId,
                data: entryData,
                meta: entryMeta,
            })
            .expect(200);

        expect(body.entryId).toBeDefined();
        expect(body.scope).toBe('widget');
        expect(body.type).toBe('graph_node');
        expect(body.workbookId).toBe(workbookId);
        expect(body.data).toEqual(entryData);
        expect(body.meta).toEqual(entryMeta);
    });

    test('Returns 400 when creating entry with duplicate name in same workbook', async () => {
        const duplicateName = 'Duplicate entry name';

        await auth(request(app).post(routes.entries), {role: OpensourceRole.Editor})
            .send({name: duplicateName, scope: 'widget', type: 'graph_node', workbookId})
            .expect(200);

        await auth(request(app).post(routes.entries), {role: OpensourceRole.Editor})
            .send({name: duplicateName, scope: 'widget', type: 'graph_node', workbookId})
            .expect(400);
    });

    test('Returns different entryIds for separate creates', async () => {
        const create = (name: string) =>
            auth(request(app).post(routes.entries), {role: OpensourceRole.Editor})
                .send({name, scope: 'widget', type: 'graph_node', workbookId})
                .expect(200);

        const [{body: first}, {body: second}] = await Promise.all([
            create('Unique entry 1'),
            create('Unique entry 2'),
        ]);

        expect(first.entryId).not.toBe(second.entryId);
    });
});
