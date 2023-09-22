import request from 'supertest';
import usApp from '../../..';

const app = usApp.express;

describe('Check ping endpoints', () => {
    test('Ping – [GET /ping]', async () => {
        const response = await request(app).get('/ping').expect(200);

        const {body} = response;

        expect(body).toStrictEqual({result: 'pong'});
    });

    test('Ping db – [GET /ping-db]', async () => {
        // Waiting for Core-db to initialize, should take around 10ms
        await new Promise((resolve) => {
            setTimeout(resolve, 10);
        });

        const response = await request(app).get('/ping-db').expect(200);

        const {body} = response;

        expect(body).toStrictEqual({result: 'pong-db'});
    });

    test('Ping db primary – [GET /ping-db-primary]', async () => {
        const response = await request(app).get('/ping-db-primary').expect(200);

        const {body} = response;

        expect(body).toStrictEqual({result: 'db primary is ok'});
    });
});
