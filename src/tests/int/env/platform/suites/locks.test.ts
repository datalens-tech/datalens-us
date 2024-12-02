import request from 'supertest';

import {testUserLogin} from '../../../constants';
import {LOCK_DEFAULT_FIELDS} from '../../../models';
import {routes} from '../../../routes';
import {US_ERRORS, app, auth, getWorkbookBinding} from '../auth';
import {createMockWorkbook, createMockWorkbookEntry} from '../helpers';

let workbookId: string;
let entryId: string;

let testLockToken: string;
let testLockExpiryDate: string;
const duration = 80000;

const modifiedMeta = {
    test_meta: 'test_meta',
};
const modifiedData = {
    test_data: 'test_data',
};

const entryLockedMessage = 'The entry is locked';

test('Setup', async () => {
    const workbook = await createMockWorkbook();
    workbookId = workbook.workbookId;

    const entry = await createMockWorkbookEntry({workbookId});
    entryId = entry.entryId;
});

describe('Locks', () => {
    test('Create lock auth error', async () => {
        await request(app).post(`${routes.locks}/${entryId}`).expect(401);
    });

    test('Create lock for entry', async () => {
        const response = await auth(request(app).post(`${routes.locks}/${entryId}`), {
            accessBindings: [getWorkbookBinding(workbookId, 'update')],
        })
            .send({
                duration,
            })
            .expect(200);

        const {body} = response;

        expect(body).toStrictEqual({lockToken: expect.any(String)});

        testLockToken = body.lockToken;
    });

    test('Get lock for entry', async () => {
        const response = await auth(request(app).get(`${routes.locks}/${entryId}`), {
            accessBindings: [getWorkbookBinding(workbookId, 'limitedView')],
        }).expect(200);

        const {body} = response;

        expect(body).toStrictEqual({
            ...LOCK_DEFAULT_FIELDS,
            entryId,
            lockToken: testLockToken,
            login: testUserLogin,
        });

        testLockExpiryDate = body.expiryDate;
    });

    test('Try to modify locked entry', async () => {
        await auth(request(app).post(`${routes.entries}/${entryId}`), {
            accessBindings: [getWorkbookBinding(workbookId, 'update')],
        })
            .send({
                meta: modifiedMeta,
                data: modifiedData,
                mode: 'save',
            })
            .expect(423);

        const response = await auth(request(app).get(`${routes.entries}/${entryId}`), {
            accessBindings: [getWorkbookBinding(workbookId, 'limitedView')],
        }).expect(200);

        const {body} = response;

        expect(body.meta).toStrictEqual(null);
        expect(body.data).toStrictEqual(null);
    });

    test('Delete lock auth error', async () => {
        await request(app).delete(`${routes.locks}/${entryId}`).expect(401);
    });

    test('Try to delete locked entry', async () => {
        await auth(request(app).delete(`${routes.entries}/${entryId}`), {
            accessBindings: [
                getWorkbookBinding(workbookId, 'limitedView'),
                getWorkbookBinding(workbookId, 'update'),
            ],
        })
            .send({})
            .expect(423);

        const response = await auth(request(app).get(`${routes.entries}/${entryId}`), {
            accessBindings: [getWorkbookBinding(workbookId, 'limitedView')],
        }).expect(200);

        const {body} = response;

        expect(body.entryId).toBe(entryId);
    });

    test('Extend lock auth error', async () => {
        await request(app).post(`${routes.locks}/${entryId}/extend`).expect(401);
    });

    test('Extend lock', async () => {
        const response = await auth(request(app).post(`${routes.locks}/${entryId}/extend`), {
            accessBindings: [getWorkbookBinding(workbookId, 'update')],
        })
            .send({
                duration: 100000,
                lockToken: testLockToken,
            })
            .expect(200);

        const {body} = response;

        expect(body).toStrictEqual({
            ...LOCK_DEFAULT_FIELDS,
            entryId,
            lockToken: testLockToken,
            login: testUserLogin,
        });

        expect(body.expiryDate).not.toBe(testLockExpiryDate);
    });

    test('Delete lock auth error', async () => {
        await request(app).delete(`${routes.locks}/${entryId}?force=true`).expect(401);
    });

    test('Delete lock', async () => {
        const response = await auth(request(app).delete(`${routes.locks}/${entryId}?force=true`), {
            accessBindings: [getWorkbookBinding(workbookId, 'update')],
        }).expect(200);

        const {body} = response;

        expect(body).toStrictEqual({
            ...LOCK_DEFAULT_FIELDS,
            entryId,
            lockToken: testLockToken,
            login: testUserLogin,
        });

        await auth(request(app).get(`${routes.locks}/${entryId}`), {
            accessBindings: [getWorkbookBinding(workbookId, 'limitedView')],
        }).expect(404);
    });

    test('Modify unlocked entry', async () => {
        await auth(request(app).post(`${routes.entries}/${entryId}`), {
            accessBindings: [
                getWorkbookBinding(workbookId, 'limitedView'),
                getWorkbookBinding(workbookId, 'update'),
            ],
        })
            .send({
                meta: modifiedMeta,
                data: modifiedData,
                mode: 'save',
            })
            .expect(200);

        const response = await auth(request(app).get(`${routes.entries}/${entryId}`), {
            accessBindings: [getWorkbookBinding(workbookId, 'limitedView')],
        }).expect(200);

        const {body} = response;

        expect(body.meta).toStrictEqual(modifiedMeta);
        expect(body.data).toStrictEqual(modifiedData);
    });

    test('Sync create lock for entry', async () => {
        const [response1, response2] = await Promise.all([
            auth(request(app).post(`${routes.locks}/${entryId}`), {
                accessBindings: [getWorkbookBinding(workbookId, 'update')],
            }).send({
                duration,
            }),
            auth(request(app).post(`${routes.locks}/${entryId}`), {
                accessBindings: [getWorkbookBinding(workbookId, 'update')],
            }).send({
                duration,
            }),
        ]);

        const {body: body1} = response1;
        const {body: body2} = response2;

        if (body1.lockToken) {
            expect(body1).toStrictEqual({lockToken: expect.any(String)});
            testLockToken = body1.lockToken;

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
            testLockToken = body2.lockToken;

            expect(body1).toStrictEqual({
                code: US_ERRORS.ENTRY_IS_LOCKED,
                details: {
                    expiryDate: expect.any(String),
                    loginOrId: expect.any(String),
                },
                message: entryLockedMessage,
            });
        }

        await auth(request(app).delete(`${routes.locks}/${entryId}?force=true`), {
            accessBindings: [getWorkbookBinding(workbookId, 'update')],
        }).expect(200);
    });

    test('Sync create force lock for entry', async () => {
        const [response1, response2] = await Promise.all([
            auth(request(app).post(`${routes.locks}/${entryId}`), {
                accessBindings: [getWorkbookBinding(workbookId, 'update')],
            }).send({
                duration,
                force: true,
            }),
            auth(request(app).post(`${routes.locks}/${entryId}?force=true`), {
                accessBindings: [getWorkbookBinding(workbookId, 'update')],
            }).send({
                duration,
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

        await auth(request(app).delete(`${routes.locks}/${entryId}?force=true`), {
            accessBindings: [getWorkbookBinding(workbookId, 'update')],
        }).expect(200);
    });
});
