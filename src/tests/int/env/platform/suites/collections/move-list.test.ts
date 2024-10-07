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

const targetCollection2 = {
    collectionId: '',
    title: 'Target collection 2',
};

describe('Setup', () => {
    test('Create root collection', async () => {
        const collection = await createMockCollection({
            title: rootCollection.title,
            parentId: null,
        });
        rootCollection.collectionId = collection.collectionId;
    });

    test('Create targets collection', async () => {
        const collection = await createMockCollection({
            title: targetCollection.title,
            parentId: null,
        });
        targetCollection.collectionId = collection.collectionId;

        const collection2 = await createMockCollection({
            title: targetCollection2.title,
            parentId: null,
        });
        targetCollection2.collectionId = collection2.collectionId;
    });
});

describe('Moving collections', () => {
    test('Auth error', async () => {
        await request(app).post(routes.moveCollections).expect(401);
    });

    test('Update without permission error', async () => {
        await auth(request(app).post(routes.moveCollections))
            .send({
                parentId: rootCollection.collectionId,
                collectionIds: [targetCollection.collectionId, targetCollection2.collectionId],
            })
            .expect(403);
    });

    test('Update with incorrect permission error', async () => {
        await auth(request(app).post(routes.moveCollections), {
            accessBindings: [getCollectionBinding(targetCollection.collectionId, 'limitedView')],
        })
            .send({
                parentId: rootCollection.collectionId,
                collectionIds: [targetCollection.collectionId, targetCollection2.collectionId],
            })
            .expect(403);
    });

    test('Update with incorrect access binding error', async () => {
        await auth(request(app).post(routes.moveCollections), {
            accessBindings: [getCollectionBinding(unexistedCollectionId, 'limitedView')],
        })
            .send({
                parentId: rootCollection.collectionId,
                collectionIds: [targetCollection.collectionId, targetCollection2.collectionId],
            })
            .expect(403);
    });

    test('Incorrect params validation errors (without parentId)', async () => {
        await auth(request(app).post(routes.moveCollections), {
            accessBindings: [
                getCollectionBinding(targetCollection.collectionId, 'move'),
                getCollectionBinding(rootCollection.collectionId, 'limitedView'),
                getCollectionBinding(rootCollection.collectionId, 'createCollection'),
            ],
        }).expect(400);
    });

    test('Move to root collections', async () => {
        const response = await auth(request(app).post(routes.moveCollections), {
            accessBindings: [
                getCollectionBinding(targetCollection.collectionId, 'move'),
                getCollectionBinding(targetCollection2.collectionId, 'move'),
                getCollectionBinding(rootCollection.collectionId, 'limitedView'),
                getCollectionBinding(rootCollection.collectionId, 'createCollection'),
            ],
        })
            .send({
                parentId: rootCollection.collectionId,
                collectionIds: [targetCollection.collectionId, targetCollection2.collectionId],
            })
            .expect(200);

        expect(response.body).toStrictEqual({
            collections: expect.arrayContaining([
                {
                    ...COLLECTIONS_DEFAULT_FIELDS,
                    collectionId: targetCollection.collectionId,
                    title: targetCollection.title,
                    parentId: rootCollection.collectionId,
                },
                {
                    ...COLLECTIONS_DEFAULT_FIELDS,
                    collectionId: targetCollection2.collectionId,
                    title: targetCollection2.title,
                    parentId: rootCollection.collectionId,
                },
            ]),
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

    test('Move to root permission error', async () => {
        await auth(request(app).post(routes.moveCollections), {
            accessBindings: [getCollectionBinding(targetCollection.collectionId, 'move')],
        })
            .send({
                parentId: null,
                collectionIds: [targetCollection.collectionId, targetCollection2.collectionId],
            })
            .expect(403);
    });

    test('Move to root', async () => {
        const response = await auth(request(app).post(routes.moveCollections), {
            role: PlatformRole.Creator,
            accessBindings: [
                getCollectionBinding(targetCollection.collectionId, 'move'),
                getCollectionBinding(targetCollection2.collectionId, 'move'),
            ],
        })
            .send({
                parentId: null,
                collectionIds: [targetCollection.collectionId, targetCollection2.collectionId],
            })
            .expect(200);

        expect(response.body).toStrictEqual({
            collections: expect.arrayContaining([
                {
                    ...COLLECTIONS_DEFAULT_FIELDS,
                    collectionId: targetCollection.collectionId,
                    title: targetCollection.title,
                    parentId: null,
                },
                {
                    ...COLLECTIONS_DEFAULT_FIELDS,
                    collectionId: targetCollection2.collectionId,
                    title: targetCollection2.title,
                    parentId: null,
                },
            ]),
        });
    });
});
