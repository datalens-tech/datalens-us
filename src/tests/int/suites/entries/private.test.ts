import request from 'supertest';
import {testTenantId} from '../../constants';
import usApp from '../../../..';
import {US_MASTER_TOKEN_HEADER} from '../../../../const';
import {auth} from '../../utils';

const app = usApp.express;
const masterToken = usApp.config.masterToken[0];

const testEntryName = 'entries-private-test-entry';

let testEntryId: string;

describe('Get entry by private route', () => {
    test('Create entry – [POST /v1/entries]', async () => {
        const response = await auth(request(app).post('/v1/entries'))
            .send({
                scope: 'dataset',
                type: 'graph',
                key: testEntryName,
                meta: {},
                data: {},
            })
            .expect(200);

        const {body} = response;

        expect(body).toStrictEqual({
            createdAt: expect.any(String),
            createdBy: expect.any(String),
            data: {},
            entryId: expect.any(String),
            hidden: false,
            mirrored: false,
            key: testEntryName,
            links: null,
            meta: {},
            public: false,
            publishedId: null,
            revId: expect.any(String),
            savedId: expect.any(String),
            scope: 'dataset',
            tenantId: testTenantId,
            type: 'graph',
            unversionedData: {},
            updatedAt: expect.any(String),
            updatedBy: expect.any(String),
            workbookId: null,
        });

        testEntryId = body.entryId;
    });

    test('Get entry – [GET /private/entries/:entryId]', async () => {
        await request(app).get(`/private/entries/${testEntryId}`).expect(403);

        const response = await request(app)
            .get(`/private/entries/${testEntryId}`)
            .set({[US_MASTER_TOKEN_HEADER]: masterToken})
            .expect(200);

        const {body} = response;

        expect(body).toStrictEqual({
            createdAt: expect.any(String),
            createdBy: expect.any(String),
            data: {},
            entryId: expect.any(String),
            hidden: false,
            isFavorite: false,
            key: testEntryName,
            meta: {},
            public: false,
            publishedId: null,
            revId: expect.any(String),
            savedId: expect.any(String),
            scope: 'dataset',
            tenantId: testTenantId,
            type: 'graph',
            updatedAt: expect.any(String),
            updatedBy: expect.any(String),
            workbookId: null,
        });
    });
});
