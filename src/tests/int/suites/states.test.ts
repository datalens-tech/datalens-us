import request from 'supertest';
import usApp from '../../..';
import {auth} from '../utils';

const app = usApp.express;

const testEntryKey = `testDatasetState`;
let testEntryId: string;

const stateData = {
    'test-key': 'test-value1',
};

let stateHash: string;

describe('States', () => {
    test('Create entry – [POST /v1/entries]', async () => {
        const response = await auth(request(app).post('/v1/entries'))
            .send({
                scope: 'dataset',
                type: 'graph',
                key: testEntryKey,
                meta: {},
                data: {},
            })
            .expect(200);

        const {body} = response;

        expect(typeof body.entryId).toBe('string');

        testEntryId = body.entryId;
    });

    test('Create state – [POST /v1/entries]', async () => {
        const response = await request(app)
            .post(`/v1/states/${testEntryId}`)
            .send({
                data: stateData,
            })
            .expect(200);

        const {body} = response;

        expect(body).toStrictEqual({hash: expect.any(String)});

        stateHash = body.hash;
    });

    test('Get state – [GET /v1/states/:entryId/:hash]', async () => {
        const response = await request(app)
            .get(`/v1/states/${testEntryId}/${stateHash}`)
            .expect(200);

        const {body} = response;

        expect(body).toStrictEqual({
            createdAt: expect.any(String),
            data: stateData,
            entryId: testEntryId,
            hash: stateHash,
        });
    });

    test('Delete entry – [DELETE /v1/entries/:entryId]', async () => {
        await auth(request(app).delete(`/v1/entries/${testEntryId}`))
            .send({})
            .expect(200);
    });
});
