import request from 'supertest';
import {testUserLogin} from '../constants';
import usApp from '../../..';
import {US_ERRORS} from '../../../const';
import {auth} from '../utils';

const app = usApp.express;

const testDashKey = `test-locks-dash`;
let testDashId: string;

let testDashLockToken: string;
let testDashLockExpiryDate: string;

const modifiedTestDashMeta = {
    test_meta: 'test_meta',
};
const modifiedTestDashData = {
    test_data: 'test_data',
};

const entryLockedMessage = 'The entry is locked';

describe('Locks', () => {
    test('Create entry – [POST /v1/entries]', async () => {
        const response = await auth(request(app).post('/v1/entries'))
            .send({
                scope: 'dash',
                type: '',
                key: testDashKey,
                data: {},
                meta: {},
            })
            .expect(200);

        const {body} = response;

        expect(typeof body.entryId).toBe('string');

        testDashId = body.entryId;
    });

    test('Create lock for entry – [POST /v1/locks/:entryId]', async () => {
        const response = await auth(request(app).post(`/v1/locks/${testDashId}`))
            .send({
                duration: 80000,
            })
            .expect(200);

        const {body} = response;

        expect(body).toStrictEqual({lockToken: expect.any(String)});

        testDashLockToken = body.lockToken;
    });

    test('Get lock for entry – [GET /v1/locks/:entryId]', async () => {
        const response = await auth(request(app).get(`/v1/locks/${testDashId}`)).expect(200);

        const {body} = response;

        expect(body).toStrictEqual({
            entryId: testDashId,
            expiryDate: expect.any(String),
            startDate: expect.any(String),
            lockId: expect.any(String),
            lockToken: testDashLockToken,
            login: testUserLogin,
        });

        testDashLockExpiryDate = body.expiryDate;
    });

    test('Try to modify locked entry – [POST /v1/entries/:entryId]', async () => {
        await auth(request(app).post(`/v1/entries/${testDashId}`))
            .send({
                meta: {
                    test_meta: 'test_meta',
                },
                data: {
                    test_body: 'test_body',
                },
                mode: 'save',
            })
            .expect(423);

        const response = await auth(request(app).get(`/v1/entries/${testDashId}`)).expect(200);

        const {body} = response;

        expect(body.meta).toStrictEqual({});
        expect(body.data).toStrictEqual({});
    });

    test('Try to delete locked entry – [DELETE /v1/entries/:entryId]', async () => {
        await auth(request(app).delete(`/v1/entries/${testDashId}`))
            .send({})
            .expect(423);

        const response = await auth(request(app).get(`/v1/entries/${testDashId}`)).expect(200);

        const {body} = response;

        expect(body.entryId).toBe(testDashId);
    });

    test('Extend lock – [POST /v1/locks/:entryId/extend]', async () => {
        const response = await auth(request(app).post(`/v1/locks/${testDashId}/extend`))
            .send({
                duration: 100000,
                lockToken: testDashLockToken,
            })
            .expect(200);

        const {body} = response;

        expect(body).toStrictEqual({
            entryId: testDashId,
            expiryDate: expect.any(String),
            startDate: expect.any(String),
            lockId: expect.any(String),
            lockToken: testDashLockToken,
            login: testUserLogin,
        });

        expect(body.expiryDate).not.toBe(testDashLockExpiryDate);
    });

    test('Delete lock – [DELETE /v1/locks/:entryId]', async () => {
        const response = await auth(
            request(app).delete(`/v1/locks/${testDashId}?force=true`),
        ).expect(200);

        const {body} = response;

        expect(body).toStrictEqual({
            entryId: testDashId,
            expiryDate: expect.any(String),
            startDate: expect.any(String),
            lockId: expect.any(String),
            lockToken: testDashLockToken,
            login: testUserLogin,
        });

        await auth(request(app).get(`/v1/locks/${testDashId}`)).expect(404);
    });

    test('Modify unlocked entry – [POST /v1/entries/:entryId]', async () => {
        await auth(request(app).post(`/v1/entries/${testDashId}`))
            .send({
                meta: modifiedTestDashMeta,
                data: modifiedTestDashData,
                mode: 'save',
            })
            .expect(200);

        const response = await auth(request(app).get(`/v1/entries/${testDashId}`)).expect(200);

        const {body} = response;

        expect(body.meta).toStrictEqual(modifiedTestDashMeta);
        expect(body.data).toStrictEqual(modifiedTestDashData);
    });

    test('Sync create lock for entry – [POST /v1/locks/:entryId]', async () => {
        const [response1, response2] = await Promise.all([
            auth(request(app).post(`/v1/locks/${testDashId}`)).send({
                duration: 80000,
            }),
            auth(request(app).post(`/v1/locks/${testDashId}`)).send({
                duration: 80000,
            }),
        ]);

        const {body: body1} = response1;
        const {body: body2} = response2;

        if (body1.lockToken) {
            expect(body1).toStrictEqual({lockToken: expect.any(String)});
            testDashLockToken = body1.lockToken;

            expect(body2).toStrictEqual({
                code: US_ERRORS.ENTRY_IS_LOCKED,
                details: {
                    expiryDate: expect.any(String),
                    loginOrId: expect.any(String),
                },
                message: entryLockedMessage,
            });
        } else {
            expect(body2).toStrictEqual({lockToken: expect.any(String)});
            testDashLockToken = body2.lockToken;

            expect(body1).toStrictEqual({
                code: US_ERRORS.ENTRY_IS_LOCKED,
                details: {
                    expiryDate: expect.any(String),
                    loginOrId: expect.any(String),
                },
                message: entryLockedMessage,
            });
        }

        await auth(request(app).delete(`/v1/locks/${testDashId}?force=true`)).expect(200);
    });

    test('Sync create force lock for entry – [POST /v1/locks/:entryId]', async () => {
        const [response1, response2] = await Promise.all([
            auth(request(app).post(`/v1/locks/${testDashId}`)).send({
                duration: 80000,
                force: true,
            }),
            auth(request(app).post(`/v1/locks/${testDashId}?force=true`)).send({
                duration: 80000,
                force: true,
            }),
        ]);

        const {body: body1} = response1;
        const {body: body2} = response2;

        expect(body1).not.toStrictEqual({
            code: US_ERRORS.ENTRY_IS_LOCKED,
            details: {
                expiryDate: expect.any(String),
                loginOrId: expect.any(String),
            },
            message: entryLockedMessage,
        });

        expect(body2).not.toStrictEqual({
            code: US_ERRORS.ENTRY_IS_LOCKED,
            details: {
                expiryDate: expect.any(String),
                loginOrId: expect.any(String),
            },
            message: entryLockedMessage,
        });

        await auth(request(app).delete(`/v1/locks/${testDashId}?force=true`)).expect(200);
    });

    test('Delete unlocked entry – [DELETE /v1/entries/:entryId]', async () => {
        await auth(request(app).delete(`/v1/entries/${testDashId}`))
            .send({})
            .expect(200);
        await auth(request(app).get(`/v1/entries/${testDashId}`)).expect(404);
    });
});
