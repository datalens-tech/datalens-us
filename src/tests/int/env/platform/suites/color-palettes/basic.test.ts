import request from 'supertest';

import {routes} from '../../../../routes';
import {app, auth} from '../../auth';
import {PlatformRole} from '../../roles';

describe('Color palette basic tests', () => {
    let colorPaletteId: string;

    test('Create auth error', async () => {
        await request(app).post(routes.colorPalettes).expect(401);
    });

    test('Create with wrong role', async () => {
        await auth(request(app).post(routes.colorPalettes), {
            role: PlatformRole.Creator,
        })
            .send({
                displayName: 'Test',
                colors: ['#000', '#fff'],
                isGradient: false,
                isDefault: false,
            })
            .expect([401, 403]);
    });

    test('Create', async () => {
        const response = await auth(request(app).post(routes.colorPalettes), {
            role: PlatformRole.Admin,
        })
            .send({
                displayName: 'Test',
                colors: ['#000', '#fff'],
                isGradient: false,
                isDefault: false,
            })
            .expect(200);

        expect(response.body).toStrictEqual({
            colorPaletteId: expect.any(String),
            displayName: 'Test',
            colors: ['#000', '#fff'],
            isDefault: false,
            isGradient: false,
        });

        colorPaletteId = response.body.colorPaletteId;
    });

    test('Update auth error', async () => {
        await request(app).post(`${routes.colorPalettes}/${colorPaletteId}/update`).expect(401);
    });

    test('Update with wrong role', async () => {
        await auth(request(app).post(`${routes.colorPalettes}/${colorPaletteId}/update`), {
            role: PlatformRole.Creator,
        })
            .send({
                displayName: 'Update test',
                colors: ['#fff', '#000'],
                isGradient: false,
                isDefault: false,
            })
            .expect([401, 403]);
    });

    test('Update', async () => {
        const response = await auth(
            request(app).post(`${routes.colorPalettes}/${colorPaletteId}/update`),
            {
                role: PlatformRole.Admin,
            },
        )
            .send({
                displayName: 'Update test',
                colors: ['#fff', '#000'],
                isGradient: false,
                isDefault: false,
            })
            .expect(200);

        expect(response.body).toStrictEqual({
            colorPaletteId,
            displayName: 'Update test',
            colors: ['#fff', '#000'],
            isDefault: false,
            isGradient: false,
        });
    });

    test('Get', async () => {
        const response = await auth(request(app).get(`${routes.colorPalettes}/${colorPaletteId}`), {
            role: PlatformRole.Admin,
        }).expect(200);

        expect(response.body).toStrictEqual([
            {
                colorPaletteId,
                displayName: 'Update test',
                colors: ['#fff', '#000'],
                isDefault: false,
                isGradient: false,
            },
        ]);
    });

    test('Get list auth error', async () => {
        await request(app).get(routes.colorPalettes).expect(401);
    });

    test('Get list', async () => {
        const response = await auth(request(app).get(routes.colorPalettes), {
            role: PlatformRole.Admin,
        }).expect(200);

        expect(response.body).toStrictEqual([
            {
                colorPaletteId,
                displayName: 'Update test',
                colors: ['#fff', '#000'],
                isDefault: false,
                isGradient: false,
            },
        ]);

        const newColorPalette = await auth(request(app).post(routes.colorPalettes), {
            role: PlatformRole.Admin,
        })
            .send({
                displayName: 'Test 1',
                colors: ['#000', '#fff'],
                isGradient: false,
                isDefault: false,
            })
            .expect(200);

        const response2 = await auth(request(app).get(routes.colorPalettes), {
            role: PlatformRole.Admin,
        }).expect(200);

        expect(response2.body).toStrictEqual([
            {
                colorPaletteId,
                displayName: 'Update test',
                colors: ['#fff', '#000'],
                isDefault: false,
                isGradient: false,
            },
            {
                colorPaletteId: newColorPalette.body.colorPaletteId,
                displayName: 'Test 1',
                colors: ['#000', '#fff'],
                isGradient: false,
                isDefault: false,
            },
        ]);

        const response3 = await auth(request(app).get(routes.colorPalettes), {
            role: PlatformRole.Admin,
        })
            .query({filters: {colorPaletteId}})
            .expect(200);

        expect(response3.body).toStrictEqual([
            {
                colorPaletteId,
                displayName: 'Update test',
                colors: ['#fff', '#000'],
                isDefault: false,
                isGradient: false,
            },
        ]);
    });

    test('Delete auth error', async () => {
        await request(app).delete(`${routes.colorPalettes}/${colorPaletteId}`).expect(401);
    });

    test('Delete with wrong role', async () => {
        await auth(request(app).delete(`${routes.colorPalettes}/${colorPaletteId}`), {
            role: PlatformRole.Creator,
        }).expect([401, 403]);
    });

    test('Delete', async () => {
        await auth(request(app).delete(`${routes.colorPalettes}/${colorPaletteId}`), {
            role: PlatformRole.Admin,
        }).expect(200);

        const response = await auth(request(app).get(`${routes.colorPalettes}/${colorPaletteId}`), {
            role: PlatformRole.Admin,
        }).expect(200);

        expect(response.body).toStrictEqual([]);
    });
});
