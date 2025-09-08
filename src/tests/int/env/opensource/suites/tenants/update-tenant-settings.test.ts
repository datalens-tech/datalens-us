import request from 'supertest';

import {routes} from '../../../../routes';
import {app, auth} from '../../auth';
import {OpensourceRole} from '../../roles';

const testSettings = {
    key: 'defaultColorPaletteId',
    value: 'Ocean20',
};

const updateTestSettings = {
    key: 'defaultColorPaletteId',
    value: 'Sunset32',
};

describe('Update tenant settings', () => {
    test('Auth error', async () => {
        await request(app).post(routes.updateTenantSettings).expect(401);
    });

    test('Update tenant settings without permission error', async () => {
        await auth(request(app).post(routes.updateTenantSettings)).send(testSettings).expect(403);
    });

    test('Update tenant settings with wrong role error', async () => {
        await auth(request(app).post(routes.updateTenantSettings), {
            role: OpensourceRole.Editor,
        })
            .send(testSettings)
            .expect(403);

        await auth(request(app).post(routes.updateTenantSettings), {
            role: OpensourceRole.Viewer,
        })
            .send(testSettings)
            .expect(403);
    });

    test('Update tenant settings validation error', async () => {
        await auth(request(app).post(routes.updateTenantSettings), {
            role: OpensourceRole.Admin,
        })
            .send({
                key: 1,
                value: 'test value',
            })
            .expect(400);

        await auth(request(app).post(routes.updateTenantSettings), {
            role: OpensourceRole.Admin,
        })
            .send({
                key: 'key',
                value: {lvl: '2'},
            })
            .expect(400);
    });

    test('Set settings', async () => {
        const updateResponse = await auth(request(app).post(routes.updateTenantSettings), {
            role: OpensourceRole.Admin,
        })
            .send(testSettings)
            .expect(200);

        const {settings} = updateResponse.body;

        expect(settings).toStrictEqual({
            [testSettings.key]: testSettings.value,
        });
    });

    test('Update settings', async () => {
        const updateResponse = await auth(request(app).post(routes.updateTenantSettings), {
            role: OpensourceRole.Admin,
        })
            .send(updateTestSettings)
            .expect(200);

        const {settings} = updateResponse.body;

        expect(settings).toStrictEqual({
            [updateTestSettings.key]: updateTestSettings.value,
        });
    });
});
