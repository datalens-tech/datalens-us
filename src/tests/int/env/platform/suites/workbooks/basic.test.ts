import request from 'supertest';

import {testUserId} from '../../../../constants';
import {OPERATION_DEFAULT_FIELDS, WORKBOOK_DEFAULT_FIELDS} from '../../../../models';
import {routes} from '../../../../routes';
import {app, auth, authMasterToken, getWorkbookBinding, testTenantId} from '../../auth';
import {PlatformRole} from '../../roles';

const workbooksData = [
    {
        id: '',
        title: 'Test workbook title 1',
        description: 'Test workbook description 1',
    },
    {
        id: '',
        title: 'Test workbook title 2',
        description: 'Test workbook description 2',
    },
];

let testWorkbookId: string;
let testCopiedWorkbookId: string;

const testTemplateWorkbookData = {
    id: '',
    title: 'Test template workbook title',
    description: 'Testt template workbook description',
};

describe('Workbooks managment', () => {
    test('Create workbooks', async () => {
        const response1 = await auth(request(app).post(routes.workbooks), {
            role: PlatformRole.Creator,
        })
            .send({
                title: workbooksData[0].title,
                description: workbooksData[0].description,
            })
            .expect(200);

        const {body: body1} = response1;

        expect(body1).toStrictEqual({
            ...WORKBOOK_DEFAULT_FIELDS,
            createdBy: testUserId,
            updatedBy: testUserId,
            description: workbooksData[0].description,
            title: workbooksData[0].title,
            operation: OPERATION_DEFAULT_FIELDS,
        });

        workbooksData[0].id = body1.workbookId;

        const response2 = await auth(request(app).post(routes.workbooks), {
            role: PlatformRole.Creator,
        })
            .send({
                title: workbooksData[1].title,
                description: workbooksData[1].description,
            })
            .expect(200);

        const {body: body2} = response2;

        expect(body2).toStrictEqual({
            ...WORKBOOK_DEFAULT_FIELDS,
            createdBy: testUserId,
            updatedBy: testUserId,
            description: workbooksData[1].description,
            title: workbooksData[1].title,
            operation: OPERATION_DEFAULT_FIELDS,
        });

        workbooksData[1].id = body2.workbookId;
    });

    test('Get workbook by workbookId', async () => {
        const response = await auth(
            request(app).get(`${routes.workbooks}/${workbooksData[0].id}`),
            {
                accessBindings: [getWorkbookBinding(workbooksData[0].id, 'limitedView')],
            },
        ).expect(200);

        const {body} = response;

        expect(body).toStrictEqual({
            ...WORKBOOK_DEFAULT_FIELDS,
            createdBy: testUserId,
            updatedBy: testUserId,
            description: workbooksData[0].description,
            title: workbooksData[0].title,
            workbookId: workbooksData[0].id,
            collectionId: null,
        });
    });

    test('Get list of workbooks – [GET /v2/workbooks]', async () => {
        const response = await auth(request(app).get(routes.workbooks), {
            accessBindings: [
                getWorkbookBinding(workbooksData[0].id, 'limitedView'),
                getWorkbookBinding(workbooksData[1].id, 'limitedView'),
            ],
        }).expect(200);

        const {body} = response;

        expect(body).toStrictEqual({
            workbooks: expect.toIncludeSameMembers([
                {
                    ...WORKBOOK_DEFAULT_FIELDS,
                    createdBy: testUserId,
                    updatedBy: testUserId,
                    description: workbooksData[1].description,
                    title: workbooksData[1].title,
                    workbookId: workbooksData[1].id,
                    collectionId: null,
                },
                {
                    ...WORKBOOK_DEFAULT_FIELDS,
                    createdBy: testUserId,
                    updatedBy: testUserId,
                    description: workbooksData[0].description,
                    title: workbooksData[0].title,
                    workbookId: workbooksData[0].id,
                    collectionId: null,
                },
            ]),
        });
    });

    test('Get list of workbooks with pagination', async () => {
        const response1 = await auth(request(app).get(routes.workbooks), {
            accessBindings: [
                getWorkbookBinding(workbooksData[0].id, 'limitedView'),
                getWorkbookBinding(workbooksData[1].id, 'limitedView'),
            ],
        })
            .query({
                page: 0,
                pageSize: 1,
            })
            .expect(200);

        const {body: body1} = response1;

        expect(body1).toStrictEqual({
            nextPageToken: expect.any(String),
            workbooks: expect.arrayContaining([
                {
                    ...WORKBOOK_DEFAULT_FIELDS,
                    createdBy: testUserId,
                    updatedBy: testUserId,
                    description: workbooksData[0].description,
                    title: workbooksData[0].title,
                    workbookId: workbooksData[0].id,
                    collectionId: null,
                },
            ]),
        });

        let nextPageToken = body1.nextPageToken;

        const response2 = await auth(request(app).get(routes.workbooks), {
            accessBindings: [
                getWorkbookBinding(workbooksData[0].id, 'limitedView'),
                getWorkbookBinding(workbooksData[1].id, 'limitedView'),
            ],
        })
            .query({
                page: nextPageToken,
                pageSize: 1,
            })
            .expect(200);

        const {body: body2} = response2;

        expect(body2).toStrictEqual({
            nextPageToken: expect.any(String),
            workbooks: expect.arrayContaining([
                {
                    ...WORKBOOK_DEFAULT_FIELDS,
                    createdBy: testUserId,
                    updatedBy: testUserId,
                    description: workbooksData[1].description,
                    title: workbooksData[1].title,
                    workbookId: workbooksData[1].id,
                    collectionId: null,
                },
            ]),
        });

        nextPageToken = body2.nextPageToken;

        const response3 = await auth(request(app).get(routes.workbooks), {
            accessBindings: [
                getWorkbookBinding(workbooksData[0].id, 'limitedView'),
                getWorkbookBinding(workbooksData[1].id, 'limitedView'),
            ],
        })
            .query({
                page: nextPageToken,
                pageSize: 1,
            })
            .expect(200);

        const {body: body3} = response3;

        expect(body3).toStrictEqual({
            workbooks: [],
        });
    });

    test('Update workbook validation error', async () => {
        workbooksData[0].title = 'Renamed test workbook title 1';
        workbooksData[0].description = 'Renamed test workbook description 1';

        await auth(request(app).post(`${routes.workbooks}/${workbooksData[0].id}/update`), {
            accessBindings: [getWorkbookBinding(workbooksData[0].id, 'update')],
        })
            .send({
                title: `${workbooksData[0].title}/${workbooksData[0].title}`,
                description: workbooksData[0].description,
            })
            .expect(400);

        await auth(request(app).post(`${routes.workbooks}/${workbooksData[0].id}/update`), {
            accessBindings: [getWorkbookBinding(workbooksData[0].id, 'update')],
        })
            .send({
                title: `${workbooksData[0].title}\u206a`,
                description: workbooksData[0].description,
            })
            .expect(400);
    });

    test('Update workbook by workbookId', async () => {
        workbooksData[0].title = 'Renamed test workbook title 1';
        workbooksData[0].description = 'Renamed test workbook description 1';

        const response = await auth(
            request(app).post(`${routes.workbooks}/${workbooksData[0].id}/update`),
            {
                accessBindings: [getWorkbookBinding(workbooksData[0].id, 'update')],
            },
        )
            .send({
                title: workbooksData[0].title,
                description: workbooksData[0].description,
            })
            .expect(200);

        const {body} = response;

        expect(body).toStrictEqual({
            ...WORKBOOK_DEFAULT_FIELDS,
            createdBy: testUserId,
            updatedBy: testUserId,
            description: workbooksData[0].description,
            title: workbooksData[0].title,
            collectionId: null,
        });
    });

    test('Delete workbooks', async () => {
        await auth(request(app).delete(`${routes.workbooks}/${workbooksData[0].id}`), {
            accessBindings: [getWorkbookBinding(workbooksData[0].id, 'delete')],
        }).expect(200);
        await auth(request(app).delete(`${routes.workbooks}/${workbooksData[1].id}`), {
            accessBindings: [getWorkbookBinding(workbooksData[1].id, 'delete')],
        }).expect(200);

        await auth(request(app).get(`${routes.workbooks}/${workbooksData[0].id}`)).expect(404);
        await auth(request(app).get(`${routes.workbooks}/${workbooksData[1].id}`)).expect(404);

        const response = await auth(request(app).get(routes.workbooks)).expect(200);

        const {body} = response;

        expect(body).toStrictEqual({
            workbooks: [],
        });
    });
});

describe('Entries in workboooks managment', () => {
    const testTitle = 'Test workbook with entries title';
    const testDescription = 'Test workbook with entries description';

    test('Create workbook with entries', async () => {
        const entry1Name = 'Entry in test workbook 1';
        const entry2Name = 'Entry in test workbook 2';

        const responseWorkbook = await auth(request(app).post(routes.workbooks), {
            role: PlatformRole.Creator,
        })
            .send({
                title: testTitle,
                description: testDescription,
            })
            .expect(200);

        const {body: bodyWorkbook} = responseWorkbook;

        expect(bodyWorkbook).toStrictEqual({
            ...WORKBOOK_DEFAULT_FIELDS,
            createdBy: testUserId,
            updatedBy: testUserId,
            description: testDescription,
            title: testTitle,
            collectionId: null,
            operation: OPERATION_DEFAULT_FIELDS,
        });

        testWorkbookId = bodyWorkbook.workbookId;

        const responseEntry1 = await auth(request(app).post(routes.entries), {
            accessBindings: [
                getWorkbookBinding(testWorkbookId, 'limitedView'),
                getWorkbookBinding(testWorkbookId, 'update'),
            ],
        })
            .send({
                scope: 'dataset',
                type: 'graph',
                meta: {},
                data: {},
                name: entry1Name,
                workbookId: testWorkbookId,
            })
            .expect(200);

        const {body: bodyEntry1} = responseEntry1;

        expect(bodyEntry1).toStrictEqual({
            createdAt: expect.any(String),
            createdBy: expect.any(String),
            data: {},
            entryId: expect.any(String),
            hidden: false,
            mirrored: false,
            key: expect.any(String),
            links: null,
            meta: {},
            annotation: null,
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
            workbookId: testWorkbookId,
            collectionId: null,
        });

        const responseEntry2 = await auth(request(app).post(routes.entries), {
            accessBindings: [
                getWorkbookBinding(testWorkbookId, 'limitedView'),
                getWorkbookBinding(testWorkbookId, 'update'),
            ],
        })
            .send({
                scope: 'dataset',
                type: 'graph',
                meta: {},
                data: {},
                name: entry2Name,
                workbookId: testWorkbookId,
            })
            .expect(200);

        const {body: bodyEntry2} = responseEntry2;

        expect(bodyEntry2).toStrictEqual({
            createdAt: expect.any(String),
            createdBy: expect.any(String),
            data: {},
            entryId: expect.any(String),
            hidden: false,
            mirrored: false,
            key: expect.any(String),
            links: null,
            meta: {},
            annotation: null,
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
            workbookId: testWorkbookId,
            collectionId: null,
        });
    });

    test('Get workbook entries', async () => {
        const response = await auth(
            request(app).get(`${routes.workbooks}/${testWorkbookId}/entries`),
            {
                accessBindings: [
                    getWorkbookBinding(testWorkbookId, 'limitedView'),
                    getWorkbookBinding(testWorkbookId, 'view'),
                ],
            },
        ).expect(200);

        const {body} = response;

        expect(body).toStrictEqual({
            entries: expect.toIncludeSameMembers([
                {
                    createdAt: expect.any(String),
                    createdBy: expect.any(String),
                    entryId: expect.any(String),
                    hidden: false,
                    mirrored: false,
                    isLocked: false,
                    isFavorite: false,
                    key: expect.any(String),
                    displayKey: expect.any(String),
                    meta: {},
                    publishedId: null,
                    savedId: expect.any(String),
                    revId: expect.any(String),
                    scope: 'dataset',
                    type: 'graph',
                    updatedAt: expect.any(String),
                    updatedBy: expect.any(String),
                    workbookId: testWorkbookId,
                    tenantId: testTenantId,
                },
                {
                    createdAt: expect.any(String),
                    createdBy: expect.any(String),
                    entryId: expect.any(String),
                    hidden: false,
                    mirrored: false,
                    isLocked: false,
                    isFavorite: false,
                    key: expect.any(String),
                    displayKey: expect.any(String),
                    meta: {},
                    publishedId: null,
                    savedId: expect.any(String),
                    revId: expect.any(String),
                    scope: 'dataset',
                    type: 'graph',
                    updatedAt: expect.any(String),
                    updatedBy: expect.any(String),
                    workbookId: testWorkbookId,
                    tenantId: testTenantId,
                },
            ]),
        });
    });

    test('Copy workbook validation error', async () => {
        const testNewTitle = 'Copied test workbook with entries title';

        await auth(request(app).post(`${routes.workbooks}/${testWorkbookId}/copy`), {
            role: PlatformRole.Creator,
            accessBindings: [getWorkbookBinding(testWorkbookId, 'copy')],
        })
            .send({
                title: `${testNewTitle}/${testNewTitle}`,
            })
            .expect(400);

        await auth(request(app).post(`${routes.workbooks}/${testWorkbookId}/copy`), {
            role: PlatformRole.Creator,
            accessBindings: [getWorkbookBinding(testWorkbookId, 'copy')],
        })
            .send({
                title: `${testNewTitle}\u206a${testNewTitle}`,
            })
            .expect(400);
    });

    test('Copy workbook with entries', async () => {
        const testNewTitle = 'Copied test workbook with entries title';

        const response = await auth(
            request(app).post(`${routes.workbooks}/${testWorkbookId}/copy`),
            {
                role: PlatformRole.Creator,
                accessBindings: [getWorkbookBinding(testWorkbookId, 'copy')],
            },
        ).send({
            title: testNewTitle,
        });

        const {body} = response;

        expect(body).toStrictEqual({
            ...WORKBOOK_DEFAULT_FIELDS,
            collectionId: null,
            createdBy: testUserId,
            updatedBy: testUserId,
            description: testDescription,
            title: testNewTitle,
            workbookId: expect.any(String),
            operation: OPERATION_DEFAULT_FIELDS,
        });

        expect(body.workbookId).not.toBe(testWorkbookId);

        testCopiedWorkbookId = body.workbookId;
    });

    test('Check entries in copied workbook', async () => {
        const response = await auth(
            request(app).get(`${routes.workbooks}/${testCopiedWorkbookId}/entries`),
            {
                accessBindings: [
                    getWorkbookBinding(testCopiedWorkbookId, 'limitedView'),
                    getWorkbookBinding(testCopiedWorkbookId, 'view'),
                ],
            },
        ).expect(200);

        const {body} = response;

        expect(body).toStrictEqual({
            entries: expect.toIncludeSameMembers([
                {
                    createdAt: expect.any(String),
                    createdBy: expect.any(String),
                    entryId: expect.any(String),
                    hidden: false,
                    mirrored: false,
                    isLocked: false,
                    isFavorite: false,
                    key: expect.any(String),
                    displayKey: expect.any(String),
                    meta: {},
                    publishedId: null,
                    savedId: expect.any(String),
                    revId: expect.any(String),
                    scope: 'dataset',
                    type: 'graph',
                    updatedAt: expect.any(String),
                    updatedBy: expect.any(String),
                    workbookId: testCopiedWorkbookId,
                    tenantId: testTenantId,
                },
                {
                    createdAt: expect.any(String),
                    createdBy: expect.any(String),
                    entryId: expect.any(String),
                    hidden: false,
                    mirrored: false,
                    isLocked: false,
                    isFavorite: false,
                    key: expect.any(String),
                    displayKey: expect.any(String),
                    meta: {},
                    publishedId: null,
                    savedId: expect.any(String),
                    revId: expect.any(String),
                    scope: 'dataset',
                    type: 'graph',
                    updatedAt: expect.any(String),
                    updatedBy: expect.any(String),
                    workbookId: testCopiedWorkbookId,
                    tenantId: testTenantId,
                },
            ]),
        });
    });

    test('Delete workbooks with entries', async () => {
        await auth(request(app).delete(`${routes.workbooks}/${testWorkbookId}`), {
            accessBindings: [getWorkbookBinding(testWorkbookId, 'delete')],
        }).expect(200);
        await auth(request(app).delete(`${routes.workbooks}/${testCopiedWorkbookId}`), {
            accessBindings: [getWorkbookBinding(testCopiedWorkbookId, 'delete')],
        }).expect(200);

        await auth(request(app).get(`${routes.workbooks}/${testWorkbookId}`)).expect(404);
        await auth(request(app).get(`${routes.workbooks}/${testCopiedWorkbookId}`)).expect(404);
    });
});

describe('Workbook template', () => {
    test('Create workbook', async () => {
        const response = await auth(request(app).post(routes.workbooks), {
            role: PlatformRole.Creator,
        })
            .send({
                title: testTemplateWorkbookData.title,
                description: testTemplateWorkbookData.description,
            })
            .expect(200);

        const {body} = response;

        expect(body).toStrictEqual({
            ...WORKBOOK_DEFAULT_FIELDS,
            collectionId: null,
            createdBy: testUserId,
            updatedBy: testUserId,
            description: testTemplateWorkbookData.description,
            title: testTemplateWorkbookData.title,
            operation: OPERATION_DEFAULT_FIELDS,
        });

        testTemplateWorkbookData.id = body.workbookId;
    });

    test('Make workbook as template', async () => {
        await request(app)
            .post(routes.privateSetIsTemplateWorkbook(testTemplateWorkbookData.id))
            .send({
                workbookId: testTemplateWorkbookData.id,
                isTemplate: true,
            })
            .expect(403);

        const response = await authMasterToken(
            request(app).post(routes.privateSetIsTemplateWorkbook(testTemplateWorkbookData.id)),
        ).send({
            workbookId: testTemplateWorkbookData.id,
            isTemplate: true,
        });

        const {body} = response;

        expect(body).toStrictEqual({
            workbookId: expect.any(String),
            isTemplate: true,
        });
    });
});
