import request from 'supertest';

import {COLLECTIONS_DEFAULT_FIELDS} from '../../../../models';
import {routes} from '../../../../routes';
import {app, auth, getCollectionBinding} from '../../auth';
import {createMockCollection} from '../../helpers';

const unexistedCollectionId = 'unexisted-collection-id';

const testCollection = {
    collectionId: '',
    title: 'Collection title',
};

const newTitle = 'New collection title';
const newDescription = 'New collection description';

describe('Setup', () => {
    test('Create test collection', async () => {
        const collection = await createMockCollection({
            title: testCollection.title,
            parentId: null,
        });
        testCollection.collectionId = collection.collectionId;
    });
});

describe('Updating collection', () => {
    test('Auth error', async () => {
        await request(app)
            .post(`${routes.collections}/${testCollection.collectionId}/update`)
            .expect(401);
    });

    test('Update without permission error', async () => {
        await auth(request(app).post(`${routes.collections}/${testCollection.collectionId}/update`))
            .send({
                title: newTitle,
            })
            .expect(403);
    });

    test('Update with incorrect permission error', async () => {
        await auth(
            request(app).post(`${routes.collections}/${testCollection.collectionId}/update`),
            {
                accessBindings: [getCollectionBinding(testCollection.collectionId, 'limitedView')],
            },
        )
            .send({
                title: newTitle,
            })
            .expect(403);
    });

    test('Update with incorrect access binding error', async () => {
        await auth(
            request(app).post(`${routes.collections}/${testCollection.collectionId}/update`),
            {
                accessBindings: [getCollectionBinding(unexistedCollectionId, 'limitedView')],
            },
        )
            .send({
                title: newTitle,
            })
            .expect(403);
    });

    // TODO: Add 400 error without params
    // test('Update without params validation error', async () => {
    //     await auth(
    //         request(app).post(`${routes.collections}/${testCollection.collectionId}/update`),
    //         {
    //             accessBindings: [getCollectionBinding(testCollection.collectionId, 'update')],
    //         },
    //     ).expect(400);
    // });

    test('Update title validation error', async () => {
        await auth(
            request(app).post(`${routes.collections}/${testCollection.collectionId}/update`),
            {
                accessBindings: [getCollectionBinding(testCollection.collectionId, 'update')],
            },
        )
            .send({
                title: `${newTitle}\u206a`,
            })
            .expect(400);

        await auth(
            request(app).post(`${routes.collections}/${testCollection.collectionId}/update`),
            {
                accessBindings: [getCollectionBinding(testCollection.collectionId, 'update')],
            },
        )
            .send({
                title: `${newTitle}/${newTitle}`,
            })
            .expect(400);
    });

    test('Update title', async () => {
        const updateResponse = await auth(
            request(app).post(`${routes.collections}/${testCollection.collectionId}/update`),
            {
                accessBindings: [getCollectionBinding(testCollection.collectionId, 'update')],
            },
        )
            .send({
                title: newTitle,
            })
            .expect(200);

        expect(updateResponse.body).toStrictEqual({
            ...COLLECTIONS_DEFAULT_FIELDS,
            title: newTitle,
            parentId: null,
        });
    });

    test('Update title and description', async () => {
        const updateResponse = await auth(
            request(app).post(`${routes.collections}/${testCollection.collectionId}/update`),
            {
                accessBindings: [getCollectionBinding(testCollection.collectionId, 'update')],
            },
        )
            .send({
                title: newTitle,
                description: newDescription,
            })
            .expect(200);

        expect(updateResponse.body).toStrictEqual({
            ...COLLECTIONS_DEFAULT_FIELDS,
            title: newTitle,
            description: newDescription,
        });
    });

    test('Get updated', async () => {
        const response = await auth(
            request(app).get(`${routes.collections}/${testCollection.collectionId}`),
            {
                accessBindings: [getCollectionBinding(testCollection.collectionId, 'limitedView')],
            },
        ).expect(200);

        expect(response.body).toStrictEqual({
            ...COLLECTIONS_DEFAULT_FIELDS,
            collectionId: testCollection.collectionId,
            title: newTitle,
            description: newDescription,
        });
    });
});
