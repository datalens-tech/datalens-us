import request from 'supertest';

import {COLLECTIONS_DEFAULT_FIELDS, COLLECTIONS_DEFAULT_PERMISSIONS} from '../../../../models';
import {routes} from '../../../../routes';
import {app, auth, getCollectionBinding} from '../../auth';
import {createMockCollection} from '../../helpers';

const rootCollection = {
    collectionId: '',
    title: 'Root collection',
};

const level1Collection = {
    collectionId: '',
    title: 'Level 1 collection',
};

const level2Collection = {
    collectionId: '',
    title: 'Level 2 collection',
};

describe('Setup', () => {
    test('Create root collection', async () => {
        const collection = await createMockCollection({
            title: rootCollection.title,
            parentId: null,
        });
        rootCollection.collectionId = collection.collectionId;
    });

    test('Create level 1 collection', async () => {
        const collection = await createMockCollection({
            title: level1Collection.title,
            parentId: rootCollection.collectionId,
        });
        level1Collection.collectionId = collection.collectionId;
    });

    test('Create level 2 collection', async () => {
        const collection = await createMockCollection({
            title: level2Collection.title,
            parentId: level1Collection.collectionId,
        });
        level2Collection.collectionId = collection.collectionId;
    });
});

describe('Getting collection breadcrumbs', () => {
    test('Auth error', async () => {
        await request(app)
            .get(`${routes.collections}/${rootCollection.collectionId}/breadcrumbs`)
            .expect(401);
    });

    test('Get root collection breadcrumbs without permission', async () => {
        await auth(
            request(app).get(`${routes.collections}/${rootCollection.collectionId}/breadcrumbs`),
        ).expect(403);
    });

    test('Get root collection breadcrumbs', async () => {
        const response = await auth(
            request(app).get(`${routes.collections}/${rootCollection.collectionId}/breadcrumbs`),
            {accessBindings: [getCollectionBinding(rootCollection.collectionId, 'limitedView')]},
        ).expect(200);

        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body.length).toBe(1);

        expect(response.body[0]).toStrictEqual({
            ...COLLECTIONS_DEFAULT_FIELDS,
            collectionId: rootCollection.collectionId,
        });
    });

    test('Get root collection breadcrumbs with "includePermissionsInfo" param', async () => {
        const response = await auth(
            request(app).get(`${routes.collections}/${rootCollection.collectionId}/breadcrumbs`),
            {accessBindings: [getCollectionBinding(rootCollection.collectionId, 'limitedView')]},
        )
            .query({
                includePermissionsInfo: 'true',
            })
            .expect(200);

        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body.length).toBe(1);

        expect(response.body[0]).toStrictEqual({
            ...COLLECTIONS_DEFAULT_FIELDS,
            collectionId: rootCollection.collectionId,
            permissions: {
                ...COLLECTIONS_DEFAULT_PERMISSIONS,
                limitedView: true,
            },
        });
    });

    test('Get level 1 collection breadcrumbs without parent collection permission', async () => {
        await auth(
            request(app).get(`${routes.collections}/${level1Collection.collectionId}/breadcrumbs`),
            {
                accessBindings: [
                    getCollectionBinding(level1Collection.collectionId, 'limitedView'),
                ],
            },
        ).expect(403);
    });

    test('Get level 1 collection breadcrumbs', async () => {
        const response = await auth(
            request(app).get(`${routes.collections}/${level1Collection.collectionId}/breadcrumbs`),
            {
                accessBindings: [
                    getCollectionBinding(rootCollection.collectionId, 'limitedView'),
                    getCollectionBinding(level1Collection.collectionId, 'limitedView'),
                ],
            },
        ).expect(200);

        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body.length).toBe(2);

        expect(response.body[0]).toStrictEqual({
            ...COLLECTIONS_DEFAULT_FIELDS,
            collectionId: rootCollection.collectionId,
        });

        expect(response.body[1]).toStrictEqual({
            ...COLLECTIONS_DEFAULT_FIELDS,
            collectionId: level1Collection.collectionId,
            parentId: rootCollection.collectionId,
        });
    });

    test('Get level 2 collection breadcrumbs without parent collection permission', async () => {
        await auth(
            request(app).get(`${routes.collections}/${level1Collection.collectionId}/breadcrumbs`),
            {
                accessBindings: [
                    getCollectionBinding(level2Collection.collectionId, 'limitedView'),
                ],
            },
        ).expect(403);
    });

    test('Get level 2 collection breadcrumbs', async () => {
        const response = await auth(
            request(app).get(`${routes.collections}/${level2Collection.collectionId}/breadcrumbs`),
            {
                accessBindings: [
                    getCollectionBinding(rootCollection.collectionId, 'limitedView'),
                    getCollectionBinding(level1Collection.collectionId, 'limitedView'),
                    getCollectionBinding(level2Collection.collectionId, 'limitedView'),
                ],
            },
        ).expect(200);

        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body.length).toBe(3);

        expect(response.body[0]).toStrictEqual({
            ...COLLECTIONS_DEFAULT_FIELDS,
            collectionId: rootCollection.collectionId,
        });

        expect(response.body[1]).toStrictEqual({
            ...COLLECTIONS_DEFAULT_FIELDS,
            collectionId: level1Collection.collectionId,
            parentId: rootCollection.collectionId,
        });

        expect(response.body[2]).toStrictEqual({
            ...COLLECTIONS_DEFAULT_FIELDS,
            collectionId: level2Collection.collectionId,
            parentId: level1Collection.collectionId,
        });
    });
});
