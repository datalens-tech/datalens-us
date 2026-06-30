import request from 'supertest';

import {routes} from '../../../../routes';
import {app, auth, getWorkbookBinding} from '../../auth';
import {createMockWorkbook, createMockWorkbookEntry, deleteMockWorkbook} from '../../helpers';

const notExistingEntryId = 'fvsb9zbfkqos2';

describe('Copy entry to workbook', () => {
    let sourceWorkbookId: string;
    let targetWorkbookId: string;
    let deletedWorkbookId: string;
    let entryId: string;

    beforeAll(async () => {
        const [sourceWorkbook, targetWorkbook, deletedWorkbook] = await Promise.all([
            createMockWorkbook({title: 'Copy entry source workbook'}),
            createMockWorkbook({title: 'Copy entry target workbook'}),
            createMockWorkbook({title: 'Copy entry deleted workbook'}),
        ]);
        sourceWorkbookId = sourceWorkbook.workbookId;
        targetWorkbookId = targetWorkbook.workbookId;
        deletedWorkbookId = deletedWorkbook.workbookId;

        await deleteMockWorkbook({workbookId: deletedWorkbookId});

        const entry = await createMockWorkbookEntry({
            name: 'Entry to copy',
            workbookId: sourceWorkbookId,
            scope: 'widget',
            type: 'graph_wizard_node',
        });
        entryId = entry.entryId;
    });

    test('Returns 401 without auth', async () => {
        await request(app)
            .post(routes.copyEntryToWorkbook(entryId))
            .send({workbookId: targetWorkbookId})
            .expect(401);
    });

    test('Returns 403 without copy permission on source', async () => {
        await auth(request(app).post(routes.copyEntryToWorkbook(entryId)), {
            accessBindings: [getWorkbookBinding(sourceWorkbookId, 'limitedView')],
        })
            .send({workbookId: targetWorkbookId})
            .expect(403);
    });

    test('Returns 404 for non-existing entry', async () => {
        await auth(request(app).post(routes.copyEntryToWorkbook(notExistingEntryId)), {
            accessBindings: [
                getWorkbookBinding(sourceWorkbookId, 'limitedView'),
                getWorkbookBinding(sourceWorkbookId, 'copy'),
                getWorkbookBinding(targetWorkbookId, 'limitedView'),
                getWorkbookBinding(targetWorkbookId, 'update'),
            ],
        })
            .send({workbookId: targetWorkbookId})
            .expect(404);
    });

    test('Returns 404 for non-existing target workbook', async () => {
        await auth(request(app).post(routes.copyEntryToWorkbook(entryId)), {
            accessBindings: [
                getWorkbookBinding(sourceWorkbookId, 'limitedView'),
                getWorkbookBinding(sourceWorkbookId, 'copy'),
                getWorkbookBinding(sourceWorkbookId, 'update'),
            ],
        })
            .send({workbookId: deletedWorkbookId})
            .expect(404);
    });

    test('Successfully copies entry to target workbook', async () => {
        const {body} = await auth(request(app).post(routes.copyEntryToWorkbook(entryId)), {
            accessBindings: [
                getWorkbookBinding(sourceWorkbookId, 'limitedView'),
                getWorkbookBinding(sourceWorkbookId, 'copy'),
                getWorkbookBinding(sourceWorkbookId, 'update'),
                getWorkbookBinding(targetWorkbookId, 'limitedView'),
                getWorkbookBinding(targetWorkbookId, 'update'),
            ],
        })
            .send({workbookId: targetWorkbookId})
            .expect(200);

        expect(body.workbookId).toBe(targetWorkbookId);
        expect(body.scope).toBe('widget');
        expect(body.type).toBe('graph_wizard_node');
        expect(body.entryId).not.toBe(entryId);
    });
});
