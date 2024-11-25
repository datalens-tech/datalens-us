import request from 'supertest';
import {app, auth, getCollectionBinding, US_ERRORS} from '../../auth';
import {createMockCollection} from '../../helpers';
import {routes} from '../../../../routes';
import {COLLECTIONS_DEFAULT_FIELDS} from '../../../../models';

const rootCollection = {
    collectionId: '',
    title: 'Empty root collection',
};

const rootCollection2 = {
    collectionId: '',
    title: 'Empty root collection 2',
};

describe('Setup', () => {
    test('Create collections', async () => {
        const collection = await createMockCollection({
            title: rootCollection.title,
            parentId: null,
        });
        rootCollection.collectionId = collection.collectionId;

        const collection2 = await createMockCollection({
            title: rootCollection2.title,
            parentId: null,
        });
        rootCollection2.collectionId = collection2.collectionId;
    });
});

describe('Get collections by ids', () => {
    test('Auth error', async () => {
        await request(app)
            .post(routes.getCollectionsListByIds)
            .send({
                collectionIds: [rootCollection.collectionId, rootCollection2.collectionId],
            })
            .expect(401);
    });

    test('Get list without permissions, should return empty list', async () => {
        const response = await auth(request(app).post(routes.getCollectionsListByIds))
            .send({
                collectionIds: [rootCollection.collectionId, rootCollection2.collectionId],
            })
            .expect(200);

        expect(response.body).toStrictEqual([]);
    });

    test('Get list with permission only 1 collection, should return 1 collection', async () => {
        const response = await auth(request(app).post(routes.getCollectionsListByIds), {
            accessBindings: [getCollectionBinding(rootCollection.collectionId, 'limitedView')],
        })
            .send({
                collectionIds: [rootCollection.collectionId, rootCollection.collectionId],
            })
            .expect(200);

        expect(response.body).toStrictEqual([
            {
                ...COLLECTIONS_DEFAULT_FIELDS,
                collectionId: rootCollection.collectionId,
            },
        ]);
    });

    test('Get list without ids, should be a validation error', async () => {
        const response = await auth(request(app).post(routes.getCollectionsListByIds), {
            accessBindings: [
                getCollectionBinding(rootCollection.collectionId, 'limitedView'),
                getCollectionBinding(rootCollection2.collectionId, 'limitedView'),
            ],
        }).expect(400);

        expect(response.body.code).toBe(US_ERRORS.VALIDATION_ERROR);
    });

    test('Successfully get list by ids', async () => {
        const response = await auth(request(app).post(routes.getCollectionsListByIds), {
            accessBindings: [
                getCollectionBinding(rootCollection.collectionId, 'limitedView'),
                getCollectionBinding(rootCollection2.collectionId, 'limitedView'),
            ],
        })
            .send({
                collectionIds: [rootCollection.collectionId, rootCollection2.collectionId],
            })
            .expect(200);

        expect(response.body).toStrictEqual([
            {
                ...COLLECTIONS_DEFAULT_FIELDS,
                collectionId: rootCollection.collectionId,
            },
            {
                ...COLLECTIONS_DEFAULT_FIELDS,
                collectionId: rootCollection2.collectionId,
            },
        ]);
    });
});
