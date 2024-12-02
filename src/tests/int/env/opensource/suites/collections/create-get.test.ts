import request from 'supertest';

import {COLLECTIONS_DEFAULT_FIELDS, OPERATION_DEFAULT_FIELDS} from '../../../../models';
import {routes} from '../../../../routes';
import {app, auth} from '../../auth';
import {OpensourceRole} from '../../roles';

const unexistedCollectionId = 'unexisted-collection-id';

let rootCollectionId: string;
const rootTitle = 'Root collection';
const rootDescription = 'Root collection description';

let nestedCollectionId: string;
const nestedTitle = 'Nested collection';
const nestedDescription = 'Nested collection description';

describe('Creating collection in root', () => {
    test('Auth error', async () => {
        await request(app).post(routes.collections).send({}).expect(401);
    });

    test('Create without permission error', async () => {
        await auth(request(app).post(routes.collections))
            .send({
                title: rootTitle,
                parentId: null,
            })
            .expect(403);
    });

    test('Create without args validation error', async () => {
        await auth(request(app).post(routes.collections), {
            role: OpensourceRole.Editor,
        }).expect(400);
    });

    test('Create with incorrect args validation error', async () => {
        await auth(request(app).post(routes.collections), {
            role: OpensourceRole.Editor,
        })
            .send({
                parentId: null,
            })
            .expect(400);
    });

    test('Successful create in root', async () => {
        const response = await auth(request(app).post(routes.collections), {
            role: OpensourceRole.Editor,
        })
            .send({
                title: rootTitle,
                description: rootDescription,
                parentId: null,
            })
            .expect(200);

        rootCollectionId = response.body.collectionId;

        expect(response.body).toStrictEqual({
            ...COLLECTIONS_DEFAULT_FIELDS,
            title: rootTitle,
            description: rootDescription,
            parentId: null,
            operation: OPERATION_DEFAULT_FIELDS,
        });
    });

    test('Create with same title error', async () => {
        await auth(request(app).post(routes.collections), {
            role: OpensourceRole.Editor,
        })
            .send({
                title: rootTitle,
                parentId: null,
            })
            .expect(409);
    });
});

describe('Getting collection in root', () => {
    test('Auth error', async () => {
        await request(app).get(`${routes.collections}/${rootCollectionId}`).expect(401);
    });

    test('Successful get', async () => {
        const response = await auth(
            request(app).get(`${routes.collections}/${rootCollectionId}`),
        ).expect(200);

        expect(response.body).toStrictEqual({
            ...COLLECTIONS_DEFAULT_FIELDS,
            collectionId: rootCollectionId,
            title: rootTitle,
            description: rootDescription,
            parentId: null,
        });
    });
});

describe('Creating nested collection', () => {
    test('Auth error', async () => {
        await request(app).post(routes.collections).expect(401);
    });

    test('Create without permission error', async () => {
        await auth(request(app).post(routes.collections))
            .send({
                title: nestedTitle,
                parentId: rootCollectionId,
            })
            .expect(403);
    });

    test('Create in unexisted collection validation error', async () => {
        await auth(request(app).post(routes.collections), {
            role: OpensourceRole.Editor,
        })
            .send({
                title: nestedTitle,
                parentId: unexistedCollectionId,
            })
            .expect(400);
    });

    test('Successful create nested collection', async () => {
        const response = await auth(request(app).post(routes.collections), {
            role: OpensourceRole.Editor,
        })
            .send({
                title: nestedTitle,
                description: nestedDescription,
                parentId: rootCollectionId,
            })
            .expect(200);

        nestedCollectionId = response.body.collectionId;

        expect(response.body).toStrictEqual({
            ...COLLECTIONS_DEFAULT_FIELDS,
            title: nestedTitle,
            description: nestedDescription,
            parentId: rootCollectionId,
            operation: OPERATION_DEFAULT_FIELDS,
        });
    });

    test('Create collection with same title error', async () => {
        await auth(request(app).post(routes.collections), {
            role: OpensourceRole.Editor,
        })
            .send({
                title: nestedTitle,
                description: nestedDescription,
                parentId: rootCollectionId,
            })
            .expect(409);
    });
});

describe('Getting nested collection', () => {
    test('Auth error', async () => {
        await request(app).get(`${routes.collections}/${nestedCollectionId}`).expect(401);
    });

    test('Successful get', async () => {
        const response = await auth(
            request(app).get(`${routes.collections}/${nestedCollectionId}`),
        ).expect(200);

        expect(response.body).toStrictEqual({
            ...COLLECTIONS_DEFAULT_FIELDS,
            collectionId: nestedCollectionId,
            title: nestedTitle,
            description: nestedDescription,
            parentId: rootCollectionId,
        });
    });
});
