import request from 'supertest';

import {routes} from '../../../../routes';
import {app, auth} from '../../auth';
import {createMockWorkbook, createMockWorkbookEntry} from '../../helpers';
import {OpensourceRole} from '../../roles';

const notExistingId = 'fvsb9zbfkqos2';

describe('Entry revisions', () => {
    let entryId: string;
    let firstRevId: string;
    let secondRevId: string;

    beforeAll(async () => {
        const workbook = await createMockWorkbook({title: 'Revisions test workbook'});
        const entry = await createMockWorkbookEntry({
            name: 'Revisions test entry',
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

    test('Get revisions auth error', async () => {
        await request(app).get(routes.entryRevisions(entryId)).expect(401);
    });

    test('Get revisions list', async () => {
        const {body} = await auth(request(app).get(routes.entryRevisions(entryId))).expect(200);

        expect(body.entries).toHaveLength(2);
        expect(body.entries[0]).toMatchObject({entryId, revId: secondRevId});
        expect(body.entries[1]).toMatchObject({entryId, revId: firstRevId});
    });

    test('Get revisions filtered by single revId', async () => {
        const {body} = await auth(request(app).get(routes.entryRevisions(entryId)))
            .query({revIds: firstRevId})
            .expect(200);

        expect(body.entries).toHaveLength(1);
        expect(body.entries[0].revId).toBe(firstRevId);
    });

    test('Get revisions filtered by revIds array', async () => {
        const {body} = await auth(request(app).get(routes.entryRevisions(entryId)))
            .query({revIds: [firstRevId, secondRevId]})
            .expect(200);

        expect(body.entries).toHaveLength(2);
    });

    test('Get revisions with pagination', async () => {
        const {body: page1} = await auth(request(app).get(routes.entryRevisions(entryId)))
            .query({pageSize: 1})
            .expect(200);

        expect(page1.entries).toHaveLength(1);
        expect(page1.nextPageToken).toEqual(expect.any(String));

        const {body: page2} = await auth(request(app).get(routes.entryRevisions(entryId)))
            .query({page: page1.nextPageToken, pageSize: 1})
            .expect(200);

        expect(page2.entries).toHaveLength(1);
        expect(page2.entries[0].revId).not.toBe(page1.entries[0].revId);
    });

    test('Get revisions with non-matching revId returns empty list', async () => {
        const {body} = await auth(request(app).get(routes.entryRevisions(entryId)))
            .query({revIds: notExistingId})
            .expect(200);

        expect(body.entries).toHaveLength(0);
    });

    test('Get revisions filtered by updatedAfter in future returns empty list', async () => {
        const {body} = await auth(request(app).get(routes.entryRevisions(entryId)))
            .query({updatedAfter: '2099-01-01T00:00:00.000Z'})
            .expect(200);

        expect(body.entries).toHaveLength(0);
    });

    test('Get revisions for non-existing entry returns error', async () => {
        await auth(request(app).get(routes.entryRevisions(notExistingId))).expect(404);
    });

    test('Get revisions with invalid pageSize returns error', async () => {
        await auth(request(app).get(routes.entryRevisions(entryId)))
            .query({pageSize: 0})
            .expect(400);
    });
});
