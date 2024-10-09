import request from 'supertest';
import {app, auth} from '../../auth';
import {createMockCollection} from '../../helpers';
import {routes} from '../../../../routes';
import {COLLECTIONS_DEFAULT_FIELDS} from '../../../../models';
import {OpensourceRole} from '../../roles';

const rootCollection = {
    collectionId: '',
    title: 'Root collection',
};

const targetCollection = {
    collectionId: '',
    title: 'Target collection',
};

describe('Setup', () => {
    test('Create root collection', async () => {
        const collection = await createMockCollection({
            title: rootCollection.title,
            parentId: null,
        });
        rootCollection.collectionId = collection.collectionId;
    });

    test('Create target collection', async () => {
        const collection = await createMockCollection({
            title: targetCollection.title,
            parentId: null,
        });
        targetCollection.collectionId = collection.collectionId;
    });
});

describe('Moving collection', () => {
    test('Auth error', async () => {
        await request(app)
            .post(`${routes.collections}/${targetCollection.collectionId}/move`)
            .expect(401);
    });

    test('Incorrect params validation errors (without parentId)', async () => {
        await auth(
            request(app).post(`${routes.collections}/${targetCollection.collectionId}/move`),
            {
                role: OpensourceRole.Editor,
            },
        ).expect(400);
    });

    test('Move to root collection', async () => {
        const response = await auth(
            request(app).post(`${routes.collections}/${targetCollection.collectionId}/move`),
            {
                role: OpensourceRole.Editor,
            },
        )
            .send({
                parentId: rootCollection.collectionId,
            })
            .expect(200);

        expect(response.body).toStrictEqual({
            ...COLLECTIONS_DEFAULT_FIELDS,
            collectionId: targetCollection.collectionId,
            title: targetCollection.title,
            parentId: rootCollection.collectionId,
        });
    });

    test('Get moved', async () => {
        const response = await auth(
            request(app).get(`${routes.collections}/${targetCollection.collectionId}`),
        ).expect(200);

        expect(response.body).toStrictEqual({
            ...COLLECTIONS_DEFAULT_FIELDS,
            collectionId: targetCollection.collectionId,
            title: targetCollection.title,
            parentId: rootCollection.collectionId,
        });
    });

    test('Circular moving error', async () => {
        await auth(request(app).post(`${routes.collections}/${rootCollection.collectionId}/move`), {
            role: OpensourceRole.Editor,
        })
            .send({
                parentId: targetCollection.collectionId,
            })
            .expect(409);
    });

    test('Move to root', async () => {
        const response = await auth(
            request(app).post(`${routes.collections}/${targetCollection.collectionId}/move`),
            {
                role: OpensourceRole.Editor,
            },
        )
            .send({
                parentId: null,
            })
            .expect(200);

        expect(response.body).toStrictEqual({
            ...COLLECTIONS_DEFAULT_FIELDS,
            collectionId: targetCollection.collectionId,
            title: targetCollection.title,
            parentId: null,
        });
    });
});
