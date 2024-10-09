import request from 'supertest';
import {testUserLogin, testUserId} from '../../../constants';
import {routes} from '../../../routes';
import {app, auth, testTenantId} from '../auth';
import {createMockWorkbook, createMockWorkbookEntry} from '../helpers';
import {makeUserId} from '../../../../../utils';
import {MODIFY_FAVORITES_DEFAULT_FIELDS, GET_FAVORITES_ENTRY_DEFAULT_FIELDS} from '../../../models';
import {OpensourceRole} from '../roles';

let workbookId: string;
let entryId: string;

const user = makeUserId(testUserId);

test('Setup', async () => {
    const workbook = await createMockWorkbook();
    workbookId = workbook.workbookId;

    const entry = await createMockWorkbookEntry({workbookId});
    entryId = entry.entryId;
});

describe('Favorites', () => {
    test('Auth errors', async () => {
        await request(app).get(routes.favorites).expect(401);
        await request(app).post(`${routes.favorites}/${entryId}`).expect(401);
        await request(app).delete(`${routes.favorites}/${entryId}`).expect(401);
    });

    test('New entry is not favorite', async () => {
        const response = await auth(request(app).get(`${routes.entries}/${entryId}`)).expect(200);

        const {body} = response;
        expect(body.isFavorite).toBe(false);
    });

    test('Add entry to favorites', async () => {
        const response = await auth(request(app).post(`${routes.favorites}/${entryId}`)).expect(
            200,
        );

        const {body} = response;

        expect(body).toStrictEqual({
            ...MODIFY_FAVORITES_DEFAULT_FIELDS,
            login: testUserLogin,
            tenantId: testTenantId,
        });

        const entryResponse = await auth(request(app).get(`${routes.entries}/${entryId}`)).expect(
            200,
        );

        const {body: entryBody} = entryResponse;

        expect(entryBody.isFavorite).toBe(true);
    });

    test('Get favorites list', async () => {
        const response = await auth(request(app).get(routes.favorites)).expect(200);

        const {body} = response;

        expect(body).toStrictEqual({
            entries: expect.arrayContaining([
                {
                    ...GET_FAVORITES_ENTRY_DEFAULT_FIELDS,
                    entryId: entryId,
                    createdBy: user,
                },
            ]),
        });

        const responseWithPermissions = await auth(request(app).get(routes.favorites), {
            role: OpensourceRole.Editor,
        })
            .query({
                includePermissionsInfo: true,
            })
            .expect(200);

        const {body: bodyWithPermissions} = responseWithPermissions;

        expect(bodyWithPermissions).toStrictEqual({
            entries: expect.arrayContaining([
                {
                    ...GET_FAVORITES_ENTRY_DEFAULT_FIELDS,
                    entryId: entryId,
                    createdBy: user,
                    permissions: {
                        admin: true,
                        edit: true,
                        read: true,
                        execute: true,
                    },
                },
            ]),
        });

        const responseWithParialPermissions = await auth(request(app).get(routes.favorites))
            .query({
                includePermissionsInfo: true,
            })
            .expect(200);

        const {body: bodyWithParialPPermissions} = responseWithParialPermissions;

        expect(bodyWithParialPPermissions).toStrictEqual({
            entries: expect.arrayContaining([
                {
                    ...GET_FAVORITES_ENTRY_DEFAULT_FIELDS,
                    entryId: entryId,
                    createdBy: user,
                    permissions: {
                        admin: false,
                        edit: false,
                        read: true,
                        execute: true,
                    },
                },
            ]),
        });
    });

    test('Delete entry from favorites', async () => {
        const response = await auth(request(app).delete(`${routes.favorites}/${entryId}`)).expect(
            200,
        );

        const {body} = response;

        expect(body).toHaveLength(1);

        expect(body[0]).toStrictEqual({
            ...MODIFY_FAVORITES_DEFAULT_FIELDS,
            login: testUserLogin,
            tenantId: testTenantId,
        });

        const entryResponse = await auth(request(app).get(`${routes.entries}/${entryId}`)).expect(
            200,
        );

        const {body: entryBody} = entryResponse;

        expect(entryBody.isFavorite).toBe(false);
    });
});
