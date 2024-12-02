import request from 'supertest';

import {testOtherUserId} from '../../../../constants';
import {
    COLLECTIONS_DEFAULT_FIELDS,
    GET_COLLECTION_CONTENT_DEFAULT_FIELDS,
    WORKBOOK_DEFAULT_FIELDS,
} from '../../../../models';
import {routes} from '../../../../routes';
import {app, auth} from '../../auth';
import {createMockCollection, createMockWorkbook} from '../../helpers';

const rootCollection = {
    collectionId: '',
    title: 'Root collection',
};

const nestedCollection = {
    collectionId: '',
    title: 'Nested collection',
};

const nestedWorkbook = {
    workbookId: '',
    title: 'Nested workbook',
};

const rootWorkbook = {
    workbookId: '',
    title: 'Root workbook entry',
};

const rootCollection2 = {
    collectionId: '',
    title: 'Second root collection',
};

const rootWorkbook2 = {
    workbookId: '',
    title: 'Second root workbook entry',
};

describe('Setup', () => {
    test('Create all test entities', async () => {
        const [rootCol, rootWorkb, rootCol2, rootWorkb2] = await Promise.all([
            createMockCollection({
                title: rootCollection.title,
                parentId: null,
            }),
            createMockWorkbook({
                title: rootWorkbook.title,
                collectionId: null,
            }),
            createMockCollection({
                title: rootCollection2.title,
                parentId: null,
            }),
            createMockWorkbook({
                title: rootWorkbook2.title,
                collectionId: null,
            }),
        ]);
        rootCollection.collectionId = rootCol.collectionId;
        rootWorkbook.workbookId = rootWorkb.workbookId;
        rootCollection2.collectionId = rootCol2.collectionId;
        rootWorkbook2.workbookId = rootWorkb2.workbookId;

        const [nestedCol, nestedWorkb] = await Promise.all([
            createMockCollection({
                title: nestedCollection.title,
                parentId: rootCollection.collectionId,
            }),
            createMockWorkbook({
                title: nestedWorkbook.title,
                collectionId: rootCollection.collectionId,
            }),
        ]);
        nestedCollection.collectionId = nestedCol.collectionId;
        nestedWorkbook.workbookId = nestedWorkb.workbookId;
    });
});

describe('Getting root content', () => {
    test('Auth error', async () => {
        await request(app).get(routes.collectionContent).expect(401);
    });

    test('Get root content', async () => {
        const response = await auth(request(app).get(routes.collectionContent)).expect(200);

        expect(response.body).toStrictEqual({
            ...GET_COLLECTION_CONTENT_DEFAULT_FIELDS,
            workbooks: expect.arrayContaining([
                {
                    ...WORKBOOK_DEFAULT_FIELDS,
                    workbookId: rootWorkbook.workbookId,
                    collectionId: null,
                },
                {
                    ...WORKBOOK_DEFAULT_FIELDS,
                    workbookId: rootWorkbook2.workbookId,
                    collectionId: null,
                },
            ]),
            collections: expect.arrayContaining([
                {
                    ...COLLECTIONS_DEFAULT_FIELDS,
                    collectionId: rootCollection.collectionId,
                    parentId: null,
                },
                {
                    ...COLLECTIONS_DEFAULT_FIELDS,
                    collectionId: rootCollection2.collectionId,
                    parentId: null,
                },
            ]),
        });
    });
});

describe('Getting collection content', () => {
    test('Get collection content', async () => {
        const response = await auth(request(app).get(routes.collectionContent))
            .query({
                collectionId: rootCollection.collectionId,
            })
            .expect(200);

        expect(response.body).toStrictEqual({
            ...GET_COLLECTION_CONTENT_DEFAULT_FIELDS,
            workbooks: expect.arrayContaining([
                {
                    ...WORKBOOK_DEFAULT_FIELDS,
                    workbookId: nestedWorkbook.workbookId,
                    collectionId: rootCollection.collectionId,
                },
            ]),
            collections: expect.arrayContaining([
                {
                    ...COLLECTIONS_DEFAULT_FIELDS,
                    collectionId: nestedCollection.collectionId,
                    parentId: rootCollection.collectionId,
                },
            ]),
        });
    });
});

describe('Getting root content with "filterString" param', () => {
    test('Get root content', async () => {
        const response = await auth(request(app).get(routes.collectionContent))
            .query({
                filterString: rootCollection.title,
            })
            .expect(200);

        expect(response.body).toStrictEqual({
            ...GET_COLLECTION_CONTENT_DEFAULT_FIELDS,
            collections: expect.arrayContaining([
                {
                    ...COLLECTIONS_DEFAULT_FIELDS,
                    collectionId: rootCollection.collectionId,
                    parentId: null,
                },
            ]),
        });
    });
});

describe('Getting root content with "onlyMy" param', () => {
    test('Get root content with onlyMy = true for other userId', async () => {
        const response = await auth(request(app).get(routes.collectionContent), {
            userId: testOtherUserId,
        })
            .query({
                onlyMy: 'true',
            })
            .expect(200);

        expect(response.body).toStrictEqual({
            ...GET_COLLECTION_CONTENT_DEFAULT_FIELDS,
        });
    });

    test('Get root content with onlyMy = false for other userId', async () => {
        const response = await auth(request(app).get(routes.collectionContent), {
            userId: testOtherUserId,
        })
            .query({
                onlyMy: 'false',
            })
            .expect(200);

        expect(response.body).toStrictEqual({
            ...GET_COLLECTION_CONTENT_DEFAULT_FIELDS,
            collections: expect.arrayContaining([
                {
                    ...COLLECTIONS_DEFAULT_FIELDS,
                    collectionId: rootCollection.collectionId,
                    parentId: null,
                },
            ]),
            workbooks: expect.arrayContaining([
                {
                    ...WORKBOOK_DEFAULT_FIELDS,
                    workbookId: rootWorkbook.workbookId,
                    collectionId: null,
                },
            ]),
        });
    });
});

describe('Getting root content with "mode" param', () => {
    test('Get root content with mode = onlyCollections', async () => {
        const response = await auth(request(app).get(routes.collectionContent))
            .query({
                mode: 'onlyCollections',
            })
            .expect(200);

        expect(response.body).toStrictEqual({
            ...GET_COLLECTION_CONTENT_DEFAULT_FIELDS,
            collections: expect.arrayContaining([
                {
                    ...COLLECTIONS_DEFAULT_FIELDS,
                    collectionId: rootCollection.collectionId,
                    parentId: null,
                },
            ]),
        });
    });

    test('Get root content with mode = onlyWorkbooks', async () => {
        const response = await auth(request(app).get(routes.collectionContent))
            .query({
                mode: 'onlyWorkbooks',
            })
            .expect(200);

        expect(response.body).toStrictEqual({
            ...GET_COLLECTION_CONTENT_DEFAULT_FIELDS,
            workbooks: expect.arrayContaining([
                {
                    ...WORKBOOK_DEFAULT_FIELDS,
                    workbookId: rootWorkbook.workbookId,
                    collectionId: null,
                },
            ]),
        });
    });
});

describe('Getting root content with pagination', () => {
    let collectionsNextPageToken = '';
    let workbooksNextPageToken = '';

    test('Get root content first page', async () => {
        const response = await auth(request(app).get(routes.collectionContent))
            .query({
                pageSize: 1,
            })
            .expect(200);

        collectionsNextPageToken = response.body.collectionsNextPageToken;
        workbooksNextPageToken = response.body.workbooksNextPageToken;

        expect(response.body).toStrictEqual({
            ...GET_COLLECTION_CONTENT_DEFAULT_FIELDS,
            collections: expect.arrayContaining([
                {
                    ...COLLECTIONS_DEFAULT_FIELDS,
                    collectionId: rootCollection.collectionId,
                    parentId: null,
                },
            ]),
            workbooks: expect.arrayContaining([
                {
                    ...WORKBOOK_DEFAULT_FIELDS,
                    workbookId: rootWorkbook.workbookId,
                    collectionId: null,
                },
            ]),
            collectionsNextPageToken: expect.any(String),
            workbooksNextPageToken: expect.any(String),
        });
    });

    test('Get root content second page', async () => {
        const response = await auth(request(app).get(routes.collectionContent))
            .query({
                pageSize: 1,
                collectionsPage: collectionsNextPageToken,
                workbooksPage: workbooksNextPageToken,
            })
            .expect(200);

        expect(response.body).toStrictEqual({
            ...GET_COLLECTION_CONTENT_DEFAULT_FIELDS,
            collectionsNextPageToken: '2',
            collections: expect.arrayContaining([
                {
                    ...COLLECTIONS_DEFAULT_FIELDS,
                    collectionId: rootCollection2.collectionId,
                    parentId: null,
                },
            ]),
            workbooksNextPageToken: '2',
            workbooks: expect.arrayContaining([
                {
                    ...WORKBOOK_DEFAULT_FIELDS,
                    workbookId: rootWorkbook2.workbookId,
                    collectionId: null,
                },
            ]),
        });

        const response1 = await auth(request(app).get(routes.collectionContent))
            .query({
                pageSize: 2,
                collectionsPage: collectionsNextPageToken,
                workbooksPage: workbooksNextPageToken,
            })
            .expect(200);

        expect(response1.body).toStrictEqual({
            ...GET_COLLECTION_CONTENT_DEFAULT_FIELDS,
        });
    });
});

describe('Getting root content with sorting', () => {
    test('Get root content with orderField = title and orderDirection = asc', async () => {
        const response = await auth(request(app).get(routes.collectionContent))
            .query({
                orderField: 'title',
                orderDirection: 'asc',
            })
            .expect(200);

        const {body} = response;

        expect(body.collections[0].collectionId).toBe(rootCollection.collectionId);
        expect(body.collections[1].collectionId).toBe(rootCollection2.collectionId);

        expect(body.workbooks[0].workbookId).toBe(rootWorkbook.workbookId);
        expect(body.workbooks[1].workbookId).toBe(rootWorkbook2.workbookId);
    });

    test('Get root content with orderField = title and orderDirection = desc', async () => {
        const response = await auth(request(app).get(routes.collectionContent))
            .query({
                orderField: 'title',
                orderDirection: 'desc',
            })
            .expect(200);

        const {body} = response;

        expect(body.collections[0].collectionId).toBe(rootCollection2.collectionId);
        expect(body.collections[1].collectionId).toBe(rootCollection.collectionId);

        expect(body.workbooks[0].workbookId).toBe(rootWorkbook2.workbookId);
        expect(body.workbooks[1].workbookId).toBe(rootWorkbook.workbookId);
    });

    test('Get root content with orderField = createdAt and orderDirection = asc', async () => {
        const response = await auth(request(app).get(routes.collectionContent))
            .query({
                orderField: 'createdAt',
                orderDirection: 'asc',
            })
            .expect(200);

        const {body} = response;

        expect(body.collections[0].collectionId).toBe(rootCollection.collectionId);
        expect(body.collections[1].collectionId).toBe(rootCollection2.collectionId);

        expect(body.workbooks[0].workbookId).toBe(rootWorkbook.workbookId);
        expect(body.workbooks[1].workbookId).toBe(rootWorkbook2.workbookId);
    });

    test('Get root content with orderField = createdAt and orderDirection = desc', async () => {
        const response = await auth(request(app).get(routes.collectionContent))
            .query({
                orderField: 'title',
                orderDirection: 'desc',
            })
            .expect(200);

        const {body} = response;

        expect(body.collections[0].collectionId).toBe(rootCollection2.collectionId);
        expect(body.collections[1].collectionId).toBe(rootCollection.collectionId);

        expect(body.workbooks[0].workbookId).toBe(rootWorkbook2.workbookId);
        expect(body.workbooks[1].workbookId).toBe(rootWorkbook.workbookId);
    });
});
