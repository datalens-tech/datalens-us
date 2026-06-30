import request from 'supertest';

import {routes} from '../../../../routes';
import {app, auth, getWorkbookBinding} from '../../auth';
import {createMockWorkbook, createMockWorkbookEntry, deleteMockWorkbook} from '../../helpers';

describe('Copy entries to workbook', () => {
    let sourceWorkbookId: string;
    let targetWorkbookId: string;
    let deletedWorkbookId: string;
    let entryId1: string;
    let entryId2: string;

    beforeAll(async () => {
        const [sourceWorkbook, targetWorkbook, deletedWorkbook] = await Promise.all([
            createMockWorkbook({title: 'Copy entries source workbook'}),
            createMockWorkbook({title: 'Copy entries target workbook'}),
            createMockWorkbook({title: 'Copy entries deleted workbook'}),
        ]);
        sourceWorkbookId = sourceWorkbook.workbookId;
        targetWorkbookId = targetWorkbook.workbookId;
        deletedWorkbookId = deletedWorkbook.workbookId;

        await deleteMockWorkbook({workbookId: deletedWorkbookId});

        const [entry1, entry2] = await Promise.all([
            createMockWorkbookEntry({
                name: 'Entry to copy 1',
                workbookId: sourceWorkbookId,
                scope: 'widget',
                type: 'graph_wizard_node',
            }),
            createMockWorkbookEntry({
                name: 'Entry to copy 2',
                workbookId: sourceWorkbookId,
                scope: 'widget',
                type: 'graph_wizard_node',
            }),
        ]);
        entryId1 = entry1.entryId;
        entryId2 = entry2.entryId;
    });

    test('Returns 401 without auth', async () => {
        await request(app)
            .post(routes.copyEntriesToWorkbook)
            .send({entryIds: [entryId1], workbookId: targetWorkbookId})
            .expect(401);
    });

    test('Returns 403 without copy permission on source', async () => {
        await auth(request(app).post(routes.copyEntriesToWorkbook), {
            accessBindings: [getWorkbookBinding(sourceWorkbookId, 'limitedView')],
        })
            .send({entryIds: [entryId1], workbookId: targetWorkbookId})
            .expect(403);
    });

    test('Returns 404 for non-existing target workbook', async () => {
        await auth(request(app).post(routes.copyEntriesToWorkbook), {
            accessBindings: [
                getWorkbookBinding(sourceWorkbookId, 'limitedView'),
                getWorkbookBinding(sourceWorkbookId, 'copy'),
            ],
        })
            .send({entryIds: [entryId1], workbookId: deletedWorkbookId})
            .expect(404);
    });

    test('Returns 400 when entryIds is empty', async () => {
        await auth(request(app).post(routes.copyEntriesToWorkbook), {
            accessBindings: [
                getWorkbookBinding(sourceWorkbookId, 'limitedView'),
                getWorkbookBinding(sourceWorkbookId, 'copy'),
                getWorkbookBinding(targetWorkbookId, 'limitedView'),
                getWorkbookBinding(targetWorkbookId, 'update'),
            ],
        })
            .send({entryIds: [], workbookId: targetWorkbookId})
            .expect(400);
    });

    test('Successfully copies entries to target workbook', async () => {
        const {body} = await auth(request(app).post(routes.copyEntriesToWorkbook), {
            accessBindings: [
                getWorkbookBinding(sourceWorkbookId, 'limitedView'),
                getWorkbookBinding(sourceWorkbookId, 'copy'),
                getWorkbookBinding(targetWorkbookId, 'limitedView'),
                getWorkbookBinding(targetWorkbookId, 'update'),
            ],
        })
            .send({entryIds: [entryId1, entryId2], workbookId: targetWorkbookId})
            .expect(200);

        expect(body.workbookId).toBe(targetWorkbookId);
    });
});
