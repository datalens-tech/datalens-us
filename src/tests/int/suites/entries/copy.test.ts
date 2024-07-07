import request from 'supertest';
import usApp from '../../../..';
import {auth} from '../../utils';
import {ZITADEL_USER_ROLE_HEADER} from '../../constants';
import {ZitadelUserRole} from '../../../../types/zitadel';

const app = usApp.express;

describe('Copy entries', () => {
    let workbookId1: string;
    let workbookId2: string;

    let workbookId1EntryId1: string;
    let workbookId1EntryId2: string;

    test('Create workbooks - [POST /v2/workbooks]', async () => {
        const {body: workbook1Body} = await auth(request(app).post('/v2/workbooks'))
            .send({
                title: 'Workbook1',
                description: 'Description1',
            })
            .expect(200);

        const {body: workbook2Body} = await auth(request(app).post('/v2/workbooks'))
            .send({
                title: 'Workbook2',
                description: 'Description2',
            })
            .expect(200);

        workbookId1 = workbook1Body.workbookId;
        workbookId2 = workbook2Body.workbookId;
    });

    test('Create entries - [POST /v1/entries]', async () => {
        await auth(request(app).post('/v1/entries'))
            .send({
                scope: 'dataset',
                type: 'graph',
                meta: {},
                data: {},
                name: 'EntryName1',
                workbookId: workbookId1,
            })
            .expect(403);

        const {body: entry1Body} = await auth(request(app).post('/v1/entries'))
            .set({[ZITADEL_USER_ROLE_HEADER]: ZitadelUserRole.Editor})
            .send({
                scope: 'dataset',
                type: 'graph',
                meta: {},
                data: {},
                name: 'EntryName1',
                workbookId: workbookId1,
            })
            .expect(200);

        const {body: entry2Body} = await auth(request(app).post('/v1/entries'))
            .set({[ZITADEL_USER_ROLE_HEADER]: ZitadelUserRole.Editor})
            .send({
                scope: 'dataset',
                type: 'graph',
                meta: {},
                data: {},
                name: 'EntryName2',
                workbookId: workbookId1,
            })
            .expect(200);

        workbookId1EntryId1 = entry1Body.entryId;
        workbookId1EntryId2 = entry2Body.entryId;
    });

    test('Copy entries - [POST /v2/copy-entries]', async () => {
        await auth(request(app).post('/v2/copy-entries'))
            .send({
                entryIds: [workbookId1EntryId1, workbookId1EntryId2],
                workbookId: workbookId2,
            })
            .expect(403);

        const {body} = await auth(request(app).post('/v2/copy-entries'))
            .set({[ZITADEL_USER_ROLE_HEADER]: ZitadelUserRole.Editor})
            .send({
                entryIds: [workbookId1EntryId1, workbookId1EntryId2],
                workbookId: workbookId2,
            })
            .expect(200);

        expect(body.workbookId).toBe(workbookId2);

        const {
            body: {entries},
        } = await auth(request(app).get(`/v2/workbooks/${workbookId2}/entries`))
            .send()
            .expect(200);

        expect(entries).toHaveLength(2);

        const entryNames = entries.map((entry: {key: string}) => entry.key.split('/')[1]);

        expect(entryNames).toContain('EntryName1');
        expect(entryNames).toContain('EntryName2');
    });

    test('Copy entries with duplicate names - [POST /v2/copy-entries]', async () => {
        await auth(request(app).post('/v2/copy-entries'))
            .send({
                entryIds: [workbookId1EntryId1, workbookId1EntryId2],
                workbookId: workbookId2,
            })
            .expect(403);

        await auth(request(app).post('/v2/copy-entries'))
            .set({
                [ZITADEL_USER_ROLE_HEADER]: ZitadelUserRole.Editor,
            })
            .send({
                entryIds: [workbookId1EntryId1, workbookId1EntryId2],
                workbookId: workbookId2,
            })
            .expect(200);

        const {
            body: {entries},
        } = await auth(request(app).get(`/v2/workbooks/${workbookId2}/entries`))
            .send()
            .expect(200);

        expect(entries).toHaveLength(4);

        const entryNames = entries.map((entry: {key: string}) => entry.key.split('/')[1]);

        expect(entryNames).toContain('EntryName1');
        expect(entryNames).toContain('EntryName2');
        expect(entryNames).toContain('EntryName1 (COPY 1)');
        expect(entryNames).toContain('EntryName2 (COPY 1)');
    });

    test('Copy entries with incremented duplicate names  - [POST /v2/copy-entries]', async () => {
        await auth(request(app).post('/v1/entries'))
            .send({
                scope: 'dataset',
                type: 'graph',
                meta: {},
                data: {},
                name: 'EntryName1 (COPY 1)',
                workbookId: workbookId1,
            })
            .expect(403);

        const {
            body: {entryId: workbookId1EntryId3},
        } = await auth(request(app).post('/v1/entries'))
            .set({
                [ZITADEL_USER_ROLE_HEADER]: ZitadelUserRole.Editor,
            })
            .send({
                scope: 'dataset',
                type: 'graph',
                meta: {},
                data: {},
                name: 'EntryName1 (COPY 1)',
                workbookId: workbookId1,
            })
            .expect(200);

        await auth(request(app).post('/v2/copy-entries'))
            .set({
                [ZITADEL_USER_ROLE_HEADER]: ZitadelUserRole.Editor,
            })
            .send({
                entryIds: [workbookId1EntryId3],
                workbookId: workbookId2,
            })
            .expect(200);

        const {
            body: {entries},
        } = await auth(request(app).get(`/v2/workbooks/${workbookId2}/entries`))
            .send()
            .expect(200);

        expect(entries).toHaveLength(5);

        const entryNames = entries.map((entry: {key: string}) => entry.key.split('/')[1]);

        expect(entryNames).toContain('EntryName1');
        expect(entryNames).toContain('EntryName2');
        expect(entryNames).toContain('EntryName1 (COPY 1)');
        expect(entryNames).toContain('EntryName2 (COPY 1)');
        expect(entryNames).toContain('EntryName1 (COPY 2)');
    });

    test('Delete workbooks - [DELETE /v2/workbooks/:workbookId]', async () => {
        await auth(request(app).delete(`/v2/workbooks/${workbookId1}`)).expect(403);
        await auth(request(app).delete(`/v2/workbooks/${workbookId2}`)).expect(403);

        await auth(request(app).delete(`/v2/workbooks/${workbookId1}`))
            .set({
                [ZITADEL_USER_ROLE_HEADER]: ZitadelUserRole.Editor,
            })
            .expect(200);
        await auth(request(app).delete(`/v2/workbooks/${workbookId2}`))
            .set({
                [ZITADEL_USER_ROLE_HEADER]: ZitadelUserRole.Editor,
            })
            .expect(200);
    });
});
