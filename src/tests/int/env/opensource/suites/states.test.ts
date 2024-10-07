import request from 'supertest';
import {app, auth} from '../auth';
import {routes} from '../../../routes';
import {createMockWorkbook, createMockWorkbookEntry} from '../helpers';
import {STATE_DEFAULT_FIELDS} from '../../../models';

const stateData = {
    'test-key': 'test-value1',
};

let workbookId: string;
let entryId: string;
let stateHash: string;

test('Setup', async () => {
    const workbook = await createMockWorkbook();
    workbookId = workbook.workbookId;

    const entry = await createMockWorkbookEntry({workbookId});
    entryId = entry.entryId;
});

describe('States', () => {
    test('Auth errors', async () => {
        await request(app).post(`${routes.states}/${entryId}`).expect(401);
        await request(app).get(`${routes.states}/${entryId}/${stateHash}`).expect(401);
    });

    test('Create state', async () => {
        const response = await auth(request(app).post(`${routes.states}/${entryId}`))
            .send({
                data: stateData,
            })
            .expect(200);

        const {body} = response;

        expect(body).toStrictEqual({hash: expect.any(String)});

        stateHash = body.hash;
    });

    test('Get state', async () => {
        const response = await auth(
            request(app).get(`${routes.states}/${entryId}/${stateHash}`),
        ).expect(200);

        const {body} = response;

        expect(body).toStrictEqual({
            ...STATE_DEFAULT_FIELDS,
            entryId,
            hash: stateHash,
            data: stateData,
        });
    });
});
