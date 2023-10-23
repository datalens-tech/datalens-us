import request from 'supertest';
import usApp from '../../../..';
import {withScopeHeaders} from '../../utils';

const app = usApp.express;

describe('Copy entries', () => {
    let workbookId1: string;
    let workbookId2: string;

    let workbookId1EntryId1: string;
    let workbookId1EntryId2: string;

    test('Create workbooks - [POST /v2/workbooks]', async () => {
        const {body: workbook1Body} = await withScopeHeaders(request(app).post('/v2/workbooks'))
            .send({
                title: 'Workbook1',
                description: 'Description1',
            })
            .expect(200);

        const {body: workbook2Body} = await withScopeHeaders(request(app).post('/v2/workbooks'))
            .send({
                title: 'Workbook2',
                description: 'Description2',
            })
            .expect(200);

        workbookId1 = workbook1Body.workbookId;
        workbookId2 = workbook2Body.workbookId;
    });

    test('Create entries - [POST /v1/entries]', async () => {
        const {body: entry1Body} = await withScopeHeaders(request(app).post('/v1/entries'))
            .send({
                scope: 'dataset',
                type: 'graph',
                meta: {},
                data: {},
                name: 'EntryName1',
                workbookId: workbookId1,
            })
            .expect(200);

        const {body: entry2Body} = await withScopeHeaders(request(app).post('/v1/entries'))
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
        const {body} = await withScopeHeaders(request(app).post('/v2/copy-entries'))
            .send({
                ids: [workbookId1EntryId1, workbookId1EntryId2],
                workbookId: workbookId2,
            })
            .expect(200);

        expect(body.workbookId).toBe(workbookId2);

        const {
            body: {entries},
        } = await withScopeHeaders(request(app).get(`/v2/workbooks/${workbookId2}/entries`))
            .send()
            .expect(200);

        expect(entries).toHaveLength(2);
    });

    test('Delete workbooks - [DELETE /v2/workbooks/:workbookId]', async () => {
        await withScopeHeaders(request(app).delete(`/v2/workbooks/${workbookId1}`)).expect(200);
        await withScopeHeaders(request(app).delete(`/v2/workbooks/${workbookId2}`)).expect(200);
    });
});
