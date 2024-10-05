import request from 'supertest';
import {app, auth} from '../../auth';
import {routes} from '../../../../routes';
import {OpensourceRole} from '../../roles';

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
            role: OpensourceRole.Editor,
        }).expect(200);

        expect(response.body).toStrictEqual({
            createCollectionInRoot: true,
            createWorkbookInRoot: true,
        });
    });
});
