import request from 'supertest';

import {routes} from '../../../../routes';
import {app, auth, authPrivateRoute} from '../../auth';
import {createMockWorkbook, createMockWorkbookEntry} from '../../helpers';
import {OpensourceRole} from '../../roles';

describe('Switch entry revision (private)', () => {
    let entryId: string;
    let firstRevId: string;
    let secondRevId: string;

    beforeAll(async () => {
        const workbook = await createMockWorkbook({title: 'Switch revision test workbook'});
        const entry = await createMockWorkbookEntry({
            name: 'Switch revision test entry',
            workbookId: workbook.workbookId,
            scope: 'widget',
            type: 'graph_wizard_node',
        });

        entryId = entry.entryId;
        firstRevId = entry.savedId;

        const updated = await auth(request(app).post(`${routes.entries}/${entryId}`), {
            role: OpensourceRole.Editor,
        })
            .send({mode: 'save', data: {v: 2}, meta: null})
            .expect(200);

        secondRevId = updated.body.savedId;
    });

    test('Switch revision without private auth returns 403', async () => {
        await request(app)
            .post(routes.switchRevision(entryId))
            .send({revId: firstRevId})
            .expect(403);
    });

    test('Switch revision to previous', async () => {
        const {body} = await authPrivateRoute(request(app).post(routes.switchRevision(entryId)))
            .send({revId: firstRevId})
            .expect(200);

        expect(body.isSuccess).toBe(true);
    });

    test('Switch revision back to latest', async () => {
        const {body} = await authPrivateRoute(request(app).post(routes.switchRevision(entryId)))
            .send({revId: secondRevId})
            .expect(200);

        expect(body.isSuccess).toBe(true);
    });

    test('Switch revision for non-existing entry returns error', async () => {
        const notExistingEntryId = 'fvsb9zbfkqos2';

        await authPrivateRoute(request(app).post(routes.switchRevision(notExistingEntryId)))
            .send({revId: firstRevId})
            .expect(404);
    });
});
