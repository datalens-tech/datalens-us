import request from 'supertest';

import {testDlsAdminId, testDlsAdminLogin, testUserId} from '../../../../constants';
import {routes} from '../../../../routes';
import {app, auth} from '../../auth';
import {PlatformRole} from '../../roles';

const defaultColorPaletteId = 'test1';
const updatedDefaultColorPaletteId = 'test2';

describe('Set default color palette', () => {
    test('Create folder to init user', async () => {
        await auth(request(app).post('/v1/entries'), {
            role: PlatformRole.Visitor,
            userId: testUserId,
            login: testUserId,
        })
            .send({
                key: 'create-dash-for-tests',
                scope: 'dash',
                type: '',
                meta: {},
            })
            .expect(200);
    });

    test('Auth error', async () => {
        await request(app).post(routes.setDefaultColorPalette).expect(401);
    });

    test('Set defaultColorPaletteId without permission error', async () => {
        await auth(request(app).post(routes.setDefaultColorPalette))
            .send({
                defaultColorPaletteId,
            })
            .expect(403);
    });

    test('Set defaultColorPaletteId with wrong role error', async () => {
        await auth(request(app).post(routes.setDefaultColorPalette), {
            role: PlatformRole.Visitor,
            userId: testUserId,
            login: testUserId,
        })
            .send({
                defaultColorPaletteId,
            })
            .expect(403);

        await auth(request(app).post(routes.setDefaultColorPalette), {
            role: PlatformRole.Creator,
            userId: testUserId,
            login: testUserId,
        })
            .send({
                defaultColorPaletteId,
            })
            .expect(403);
    });

    test('Set defaultColorPaletteId', async () => {
        const updateResponse = await auth(request(app).post(routes.setDefaultColorPalette), {
            role: PlatformRole.Admin,
            userId: testDlsAdminId,
            login: testDlsAdminLogin,
        })
            .send({
                defaultColorPaletteId,
            })
            .expect(200);

        const {settings} = updateResponse.body;

        expect(settings.defaultColorPaletteId).toStrictEqual(defaultColorPaletteId);
    });

    test('Update defaultColorPaletteId', async () => {
        const updateResponse = await auth(request(app).post(routes.setDefaultColorPalette), {
            role: PlatformRole.Admin,
            userId: testDlsAdminId,
            login: testDlsAdminLogin,
        })
            .send({
                defaultColorPaletteId: updatedDefaultColorPaletteId,
            })
            .expect(200);

        const {settings} = updateResponse.body;

        expect(settings.defaultColorPaletteId).toStrictEqual(updatedDefaultColorPaletteId);
    });
});
