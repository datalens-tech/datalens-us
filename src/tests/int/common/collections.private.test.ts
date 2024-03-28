import request from 'supertest';
import {testUserId, testTenantId, testProjectId} from '../constants';
import {US_MASTER_TOKEN_HEADER} from '../../../const';

import {withScopeHeaders} from '../utils';

import usApp from '../../..';

const app = usApp.express;
const masterToken = usApp.config.masterToken[0];

const collectionsData = {
    id: null,
    title: 'Test collection title 1',
    description: 'Test collection description 1',
};
describe('Private Collections managment', () => {
    test('Create collection – [POST /private/v1/collections]', async () => {
        await request(app).post('/private/v1/collections').expect(403);

        const response1 = await withScopeHeaders(request(app).post('/private/v1/collections'))
            .set({[US_MASTER_TOKEN_HEADER]: masterToken})
            .send({
                parentId: null,
                title: collectionsData.title,
                description: collectionsData.description,
            });

        const {body: body1} = response1;

        expect(body1).toStrictEqual({
            collectionId: expect.any(String),
            createdAt: expect.any(String),
            createdBy: testUserId,
            updatedAt: expect.any(String),
            updatedBy: testUserId,
            description: collectionsData.description,
            meta: {},
            projectId: testProjectId,
            tenantId: testTenantId,
            title: collectionsData.title,
            parentId: null,
        });

        await request(app).get(`/private/v1/collections/${body1.collectionId}`).expect(403);

        const response2 = await withScopeHeaders(
            request(app).get(`/private/v1/collections/${body1.collectionId}`),
        )
            .set({[US_MASTER_TOKEN_HEADER]: masterToken})
            .expect(200);

        const {body: body2} = response2;

        expect(body2).toStrictEqual({
            collectionId: expect.any(String),
            createdAt: expect.any(String),
            createdBy: testUserId,
            updatedAt: expect.any(String),
            updatedBy: testUserId,
            description: collectionsData.description,
            meta: {},
            projectId: testProjectId,
            tenantId: testTenantId,
            title: collectionsData.title,
            parentId: null,
        });
    });
});
