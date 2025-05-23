import request from 'supertest';

import {app, auth} from '../../auth';
import {PlatformRole} from '../../roles';

const testFolderName = 'relations-test-folder';

let testEntry: {
    entryId: string;
    data: Record<string, string>;
    meta: Record<string, string>;
};

let secondTestEntry: {
    entryId: string;
    data: Record<string, string>;
    meta: Record<string, string>;
};

describe('Entry relations', () => {
    // Create the test folder and entry first
    beforeAll(async () => {
        await auth(request(app).post('/v1/entries'), {
            role: PlatformRole.Creator,
        })
            .send({
                scope: 'folder',
                type: '',
                key: testFolderName,
                meta: {},
                data: {},
            })
            .expect(200);

        // Create a test entry for the update test
        const entryResponse = await auth(request(app).post('/v1/entries'), {
            role: PlatformRole.Creator,
        })
            .send({
                scope: 'dataset',
                type: 'graph',
                key: `${testFolderName}/test-entry`,
                meta: {testField: 'value'},
                data: {testData: 'data'},
            })
            .expect(200);

        testEntry = {
            entryId: entryResponse.body.entryId,
            data: {testData: 'data'},
            meta: {testField: 'value'},
        };

        // Create a second test entry for cross-linking tests
        const secondEntryResponse = await auth(request(app).post('/v1/entries'), {
            role: PlatformRole.Creator,
        })
            .send({
                scope: 'dataset',
                type: 'graph',
                key: `${testFolderName}/second-test-entry`,
                meta: {secondField: 'value2'},
                data: {secondData: 'data2'},
            })
            .expect(200);

        secondTestEntry = {
            entryId: secondEntryResponse.body.entryId,
            data: {secondData: 'data2'},
            meta: {secondField: 'value2'},
        };
    });

    test('Create dataset with valid links', async () => {
        const response = await auth(request(app).post('/v1/entries'), {
            role: PlatformRole.Creator,
        })
            .send({
                scope: 'dataset',
                type: 'graph',
                key: `${testFolderName}/dataset-valid-links`,
                meta: {},
                data: {},
                links: {
                    validLink: testEntry.entryId,
                },
            })
            .expect(200);

        // Verify the response contains the entry data
        expect(response.body).toMatchObject({
            entryId: expect.any(String),
            savedId: expect.any(String),
            key: `${testFolderName}/dataset-valid-links`,
        });
    });

    test('Create dataset with invalid links - malformed entry ID', async () => {
        const response = await auth(request(app).post('/v1/entries'), {
            role: PlatformRole.Creator,
        })
            .send({
                scope: 'dataset',
                type: 'graph',
                key: `${testFolderName}/dataset-malformed-links`,
                meta: {},
                data: {},
                links: {
                    malformedLink: 'not-a-valid-id',
                },
            })
            .expect(400);

        expect(response.body).toMatchObject({
            code: 'INCORRECT_LINK_ERROR',
            message: 'INCORRECT_LINK_ERROR',
            details: {
                invalidLinkIds: {
                    malformedLink: 'not-a-valid-id',
                },
            },
        });
    });

    test('Update with invalid links - malformed entry ID', async () => {
        const response = await auth(request(app).post(`/v1/entries/${testEntry.entryId}`), {
            role: PlatformRole.Creator,
        })
            .send({
                mode: 'save',
                data: testEntry.data,
                meta: testEntry.meta,
                links: {
                    malformedLink: 'not-a-valid-id',
                },
            })
            .expect(400);

        expect(response.body).toMatchObject({
            code: 'INCORRECT_LINK_ERROR',
            message: 'INCORRECT_LINK_ERROR',
            details: {
                invalidLinkIds: {
                    malformedLink: 'not-a-valid-id',
                },
            },
        });
    });

    test('Update with valid links', async () => {
        const response = await auth(request(app).post(`/v1/entries/${testEntry.entryId}`), {
            role: PlatformRole.Creator,
        })
            .send({
                mode: 'save',
                data: testEntry.data,
                meta: testEntry.meta,
                links: {
                    validLink: secondTestEntry.entryId,
                },
            })
            .expect(200);

        expect(response.body).toMatchObject({
            entryId: testEntry.entryId,
            savedId: expect.any(String),
        });
    });
});
