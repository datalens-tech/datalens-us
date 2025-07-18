import request from 'supertest';

import {routes} from '../../../../routes';
import {app, auth} from '../../auth';
import {OpensourceRole} from '../../roles';

const defaultColorPaletteId = 'test1';
const updatedDefaultColorPaletteId = 'test2';

describe('Set default color palette', () => {
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
            role: OpensourceRole.Editor,
        })
            .send({
                defaultColorPaletteId,
            })
            .expect(403);

        await auth(request(app).post(routes.setDefaultColorPalette), {
            role: OpensourceRole.Viewer,
        })
            .send({
                defaultColorPaletteId,
            })
            .expect(403);
    });

    test('Set defaultColorPaletteId', async () => {
        const updateResponse = await auth(request(app).post(routes.setDefaultColorPalette), {
            role: OpensourceRole.Admin,
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
            role: OpensourceRole.Admin,
        })
            .send({
                defaultColorPaletteId: updatedDefaultColorPaletteId,
            })
            .expect(200);

        const {settings} = updateResponse.body;

        expect(settings.defaultColorPaletteId).toStrictEqual(updatedDefaultColorPaletteId);
    });
});
