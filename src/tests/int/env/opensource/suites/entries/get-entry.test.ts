import request from 'supertest';

import {routes} from '../../../../routes';
import {app, auth} from '../../auth';
import {createMockWorkbook, createMockWorkbookEntry} from '../../helpers';
import {OpensourceRole} from '../../roles';

const notExistingEntryId = 'fvsb9zbfkqos2';

describe('Get entry', () => {
    let workbookId: string;
    let entryId: string;

    beforeAll(async () => {
        const workbook = await createMockWorkbook({title: 'Get entry test workbook'});
        workbookId = workbook.workbookId;

        const entry = await createMockWorkbookEntry({
            name: 'Get entry test',
            workbookId,
            scope: 'widget',
            type: 'graph_wizard_node',
        });
        entryId = entry.entryId;
    });

    test('Returns 401 without auth', async () => {
        await request(app).get(`${routes.entries}/${entryId}`).expect(401);
    });

    test('Returns 404 for non-existing entry', async () => {
        await auth(request(app).get(`${routes.entries}/${notExistingEntryId}`)).expect(404);
    });

    test('Successfully returns entry', async () => {
        const {body} = await auth(request(app).get(`${routes.entries}/${entryId}`)).expect(200);

        expect(body.entryId).toBe(entryId);
        expect(body.scope).toBe('widget');
        expect(body.type).toBe('graph_wizard_node');
        expect(body.workbookId).toBe(workbookId);
    });

    test('Returns 200 with Viewer role', async () => {
        const {body} = await auth(request(app).get(`${routes.entries}/${entryId}`), {
            role: OpensourceRole.Viewer,
        }).expect(200);

        expect(body.entryId).toBe(entryId);
    });

    test('Returns entry with data on branch=saved', async () => {
        const {body} = await auth(
            request(app).get(`${routes.entries}/${entryId}`).query({branch: 'saved'}),
        ).expect(200);

        expect(body.entryId).toBe(entryId);
        expect(body.data).toBeDefined();
    });

    test('Returns entry with includeFavorite flag', async () => {
        const {body} = await auth(
            request(app).get(`${routes.entries}/${entryId}`).query({includeFavorite: true}),
        ).expect(200);

        expect(body.entryId).toBe(entryId);
        expect(body.isFavorite).toBe(false);
    });
});
