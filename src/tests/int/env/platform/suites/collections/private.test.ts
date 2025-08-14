import request from 'supertest';

import {COLLECTIONS_DEFAULT_FIELDS} from '../../../../models';
import {routes} from '../../../../routes';
import {app, authMasterToken} from '../../auth';

const testCollection = {
    collectionId: '',
    title: 'Collection title',
    description: 'Collection description',
};

describe('Creating private collection', () => {
    test('Auth error', async () => {
        await request(app).post(routes.privateCollections).expect(403);
    });

    test('Validation title error', async () => {
        await authMasterToken(request(app).post(routes.privateCollections))
            .send({
                title: `${testCollection.title}/`,
                description: testCollection.description,
                parentId: null,
            })
            .expect(400);

        await authMasterToken(request(app).post(routes.privateCollections))
            .send({
                title: `${testCollection.title}\u206a`,
                description: testCollection.description,
                parentId: null,
            })
            .expect(400);
    });

    test('Create', async () => {
        const response = await authMasterToken(request(app).post(routes.privateCollections))
            .send({
                title: testCollection.title,
                description: testCollection.description,
                parentId: null,
            })
            .expect(200);

        testCollection.collectionId = response.body.collectionId;

        expect(response.body).toStrictEqual({
            ...COLLECTIONS_DEFAULT_FIELDS,
            title: testCollection.title,
            description: testCollection.description,
            parentId: null,
        });
    });
});

describe('Getting private collection', () => {
    test('Auth error', async () => {
        await request(app)
            .get(`${routes.privateCollections}/${testCollection.collectionId}`)
            .expect(403);
    });

    test('Get', async () => {
        const response = await authMasterToken(
            request(app).get(`${routes.privateCollections}/${testCollection.collectionId}`),
        ).expect(200);

        expect(response.body).toStrictEqual({
            ...COLLECTIONS_DEFAULT_FIELDS,
            title: testCollection.title,
            description: testCollection.description,
            parentId: null,
        });
    });
});
