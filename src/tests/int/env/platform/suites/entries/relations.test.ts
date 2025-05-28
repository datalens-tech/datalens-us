import request from 'supertest';

import {app, auth, getWorkbookBinding} from '../../auth';
import {createMockWorkbook, createMockWorkbookEntry} from '../../helpers';

let workbookId: string;
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
    beforeAll(async () => {
        // Create a workbook
        const workbook = await createMockWorkbook({title: 'Relations Test Workbook'});
        workbookId = workbook.workbookId;

        const entryResponse = await createMockWorkbookEntry({
            name: 'Test Entry',
            workbookId: workbook.workbookId,
            scope: 'dataset',
            type: 'graph',
            data: {testData: 'data'},
            meta: {testField: 'value'},
        });

        testEntry = {
            entryId: entryResponse.entryId,
            data: {testData: 'data'},
            meta: {testField: 'value'},
        };

        const secondEntryResponse = await createMockWorkbookEntry({
            name: 'Second Test Entry',
            workbookId: workbook.workbookId,
            scope: 'dataset',
            type: 'graph',
            data: {secondData: 'data2'},
            meta: {secondField: 'value2'},
        });

        secondTestEntry = {
            entryId: secondEntryResponse.entryId,
            data: {secondData: 'data2'},
            meta: {secondField: 'value2'},
        };
    });

    test('Create dataset with valid links', async () => {
        const response = await auth(request(app).post('/v1/entries'), {
            accessBindings: [
                getWorkbookBinding(workbookId, 'limitedView'),
                getWorkbookBinding(workbookId, 'view'),
                getWorkbookBinding(workbookId, 'update'),
            ],
        })
            .send({
                scope: 'dataset',
                type: 'graph',
                workbookId: workbookId,
                name: 'Dataset with Valid Links',
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
            key: expect.stringMatching(/\d+\/Dataset with Valid Links$/),
            savedId: expect.any(String),
        });
    });

    test('Create dataset with invalid links - malformed entry ID', async () => {
        const response = await auth(request(app).post('/v1/entries'), {
            accessBindings: [
                getWorkbookBinding(workbookId, 'limitedView'),
                getWorkbookBinding(workbookId, 'view'),
                getWorkbookBinding(workbookId, 'update'),
            ],
        })
            .send({
                scope: 'dataset',
                type: 'graph',
                workbookId: workbookId,
                name: 'Dataset with Malformed Links',
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
            accessBindings: [
                getWorkbookBinding(workbookId, 'limitedView'),
                getWorkbookBinding(workbookId, 'view'),
                getWorkbookBinding(workbookId, 'update'),
            ],
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
            accessBindings: [
                getWorkbookBinding(workbookId, 'limitedView'),
                getWorkbookBinding(workbookId, 'view'),
                getWorkbookBinding(workbookId, 'update'),
            ],
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
