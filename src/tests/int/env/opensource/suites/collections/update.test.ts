import request from 'supertest';

import {COLLECTIONS_DEFAULT_FIELDS} from '../../../../models';
import {routes} from '../../../../routes';
import {app, auth} from '../../auth';
import {createMockCollection} from '../../helpers';
import {OpensourceRole} from '../../roles';

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

    test('Update title', async () => {
        const updateResponse = await auth(
            request(app).post(`${routes.collections}/${testCollection.collectionId}/update`),
            {
                role: OpensourceRole.Editor,
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
                role: OpensourceRole.Editor,
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
        ).expect(200);

        expect(response.body).toStrictEqual({
            ...COLLECTIONS_DEFAULT_FIELDS,
            collectionId: testCollection.collectionId,
            title: newTitle,
            description: newDescription,
        });
    });
});
