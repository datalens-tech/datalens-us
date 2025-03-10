import request from 'supertest';

import {routes} from '../../../../routes';
import {app, auth} from '../../auth';
import {PlatformRole} from '../../roles';

describe('Getting root collection permissions', () => {
    test('Auth error', async () => {
        await request(app).get(routes.rootCollectionPermissions).expect(401);
    });

    test('Get without permissions', async () => {
        const response = await auth(request(app).get(routes.rootCollectionPermissions)).expect(200);

        expect(response.body).toStrictEqual({
            createCollectionInRoot: false,
            createWorkbookInRoot: false,
        });
    });

    test('Get with permissions', async () => {
        const response = await auth(request(app).get(routes.rootCollectionPermissions), {
            role: PlatformRole.Creator,
        }).expect(200);

        expect(response.body).toStrictEqual({
            createCollectionInRoot: true,
            createWorkbookInRoot: true,
        });
    });
});
