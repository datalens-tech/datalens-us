import request from 'supertest';
import {app, auth, getCollectionBinding} from '../../auth';
import {createMockCollection} from '../../helpers';
import {routes} from '../../../../routes';
import {COLLECTIONS_DEFAULT_FIELDS} from '../../../../models';
import {PlatformRole} from '../../roles';

const unexistedCollectionId = 'unexisted-collection-id';

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

    test('Update without permission error', async () => {
        await auth(request(app).post(`${routes.collections}/${targetCollection.collectionId}/move`))
            .send({
                parentId: rootCollection.collectionId,
            })
            .expect(403);
    });

    test('Update with incorrect permission error', async () => {
        await auth(
            request(app).post(`${routes.collections}/${targetCollection.collectionId}/move`),
            {
                accessBindings: [
                    getCollectionBinding(targetCollection.collectionId, 'limitedView'),
                ],
            },
        )
            .send({
                parentId: rootCollection.collectionId,
            })
            .expect(403);
    });

    test('Update with incorrect access binding error', async () => {
        await auth(
            request(app).post(`${routes.collections}/${targetCollection.collectionId}/move`),
            {
                accessBindings: [getCollectionBinding(unexistedCollectionId, 'limitedView')],
            },
        )
            .send({
                parentId: rootCollection.collectionId,
            })
            .expect(403);
    });

    test('Incorrect params validation errors (without parentId)', async () => {
        await auth(
            request(app).post(`${routes.collections}/${targetCollection.collectionId}/move`),
            {
                accessBindings: [
                    getCollectionBinding(targetCollection.collectionId, 'move'),
                    getCollectionBinding(rootCollection.collectionId, 'limitedView'),
                    getCollectionBinding(rootCollection.collectionId, 'createCollection'),
                ],
            },
        ).expect(400);
    });

    test('Move to root collection', async () => {
        const response = await auth(
            request(app).post(`${routes.collections}/${targetCollection.collectionId}/move`),
            {
                accessBindings: [
                    getCollectionBinding(targetCollection.collectionId, 'move'),
                    getCollectionBinding(rootCollection.collectionId, 'limitedView'),
                    getCollectionBinding(rootCollection.collectionId, 'createCollection'),
                ],
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
            {
                accessBindings: [
                    getCollectionBinding(targetCollection.collectionId, 'limitedView'),
                ],
            },
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
            accessBindings: [
                getCollectionBinding(rootCollection.collectionId, 'move'),
                getCollectionBinding(targetCollection.collectionId, 'limitedView'),
                getCollectionBinding(targetCollection.collectionId, 'createCollection'),
            ],
        })
            .send({
                parentId: targetCollection.collectionId,
            })
            .expect(409);
    });

    test('Move to root permission error', async () => {
        await auth(
            request(app).post(`${routes.collections}/${targetCollection.collectionId}/move`),
            {
                accessBindings: [getCollectionBinding(targetCollection.collectionId, 'move')],
            },
        )
            .send({
                parentId: null,
            })
            .expect(403);
    });

    test('Move to root', async () => {
        const response = await auth(
            request(app).post(`${routes.collections}/${targetCollection.collectionId}/move`),
            {
                role: PlatformRole.Creator,
                accessBindings: [getCollectionBinding(targetCollection.collectionId, 'move')],
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
