import request from 'supertest';
import {app} from '../auth';

describe('Check ping endpoints', () => {
    test('Ping', async () => {
        const response = await request(app).get('/ping').expect(200);

        const {body} = response;

        expect(body).toStrictEqual({result: 'pong'});
    });

    test('Ping db', async () => {
        // db initialization timeout
        await new Promise((resolve) => {
            setTimeout(resolve, 10);
        });

        const response = await request(app).get('/ping-db').expect(200);

        const {body} = response;

        expect(body).toStrictEqual({result: 'pong-db'});
    });

    test('Ping db primary', async () => {
        const response = await request(app).get('/ping-db-primary').expect(200);

        const {body} = response;

        expect(body).toStrictEqual({result: 'db primary is ok'});
    });
});
