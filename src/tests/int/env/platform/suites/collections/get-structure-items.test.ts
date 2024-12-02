import request from 'supertest';

import {testOtherUserId} from '../../../../constants';
import {
    COLLECTIONS_DEFAULT_FIELDS,
    COLLECTIONS_DEFAULT_PERMISSIONS,
    GET_STRUCTURE_ITEMS_DEFAULT_FIELDS,
    WORKBOOKS_DEFAULT_PERMISSIONS,
    WORKBOOK_DEFAULT_FIELDS,
} from '../../../../models';
import {routes} from '../../../../routes';
import {app, auth, getCollectionBinding, getWorkbookBinding} from '../../auth';
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
        await request(app).get(routes.structureItems).expect(401);
    });

    test('Get root content without any access bindings (empty response)', async () => {
        const response = await auth(request(app).get(routes.structureItems)).expect(200);

        expect(response.body).toStrictEqual({
            ...GET_STRUCTURE_ITEMS_DEFAULT_FIELDS,
        });
    });

    test('Get root content with partial access binding', async () => {
        const response = await auth(request(app).get(routes.structureItems), {
            accessBindings: [getCollectionBinding(rootCollection.collectionId, 'limitedView')],
        }).expect(200);

        expect(response.body).toStrictEqual({
            ...GET_STRUCTURE_ITEMS_DEFAULT_FIELDS,
            items: expect.arrayContaining([
                {
                    ...COLLECTIONS_DEFAULT_FIELDS,
                    collectionId: rootCollection.collectionId,
                    parentId: null,
                },
            ]),
        });
    });

    test('Get root content with all access bindings', async () => {
        const response = await auth(request(app).get(routes.structureItems), {
            accessBindings: [
                getCollectionBinding(rootCollection.collectionId, 'limitedView'),
                getWorkbookBinding(rootWorkbook.workbookId, 'limitedView'),
                getCollectionBinding(nestedCollection.collectionId, 'limitedView'),
                getWorkbookBinding(nestedWorkbook.workbookId, 'limitedView'),
            ],
        }).expect(200);

        expect(response.body).toStrictEqual({
            ...GET_STRUCTURE_ITEMS_DEFAULT_FIELDS,
            items: expect.arrayContaining([
                {
                    ...COLLECTIONS_DEFAULT_FIELDS,
                    collectionId: rootCollection.collectionId,
                    parentId: null,
                },
                {
                    ...WORKBOOK_DEFAULT_FIELDS,
                    workbookId: rootWorkbook.workbookId,
                    collectionId: null,
                },
            ]),
        });
    });
});

describe('Getting structure items', () => {
    test('Get structure items without access bindings (error)', async () => {
        await auth(request(app).get(routes.structureItems))
            .query({
                collectionId: rootCollection.collectionId,
            })
            .expect(403);
    });

    test('Get structure items with partial access binding', async () => {
        const response = await auth(request(app).get(routes.structureItems), {
            accessBindings: [
                getCollectionBinding(rootCollection.collectionId, 'limitedView'),
                getCollectionBinding(nestedCollection.collectionId, 'limitedView'),
            ],
        })
            .query({
                collectionId: rootCollection.collectionId,
            })
            .expect(200);

        expect(response.body).toStrictEqual({
            ...GET_STRUCTURE_ITEMS_DEFAULT_FIELDS,
            items: expect.arrayContaining([
                {
                    ...COLLECTIONS_DEFAULT_FIELDS,
                    collectionId: nestedCollection.collectionId,
                    parentId: rootCollection.collectionId,
                },
            ]),
        });
    });

    test('Get structure items with all access bindings', async () => {
        const response = await auth(request(app).get(routes.structureItems), {
            accessBindings: [
                getCollectionBinding(rootCollection.collectionId, 'limitedView'),
                getWorkbookBinding(rootWorkbook.workbookId, 'limitedView'),
                getCollectionBinding(nestedCollection.collectionId, 'limitedView'),
                getWorkbookBinding(nestedWorkbook.workbookId, 'limitedView'),
            ],
        })
            .query({
                collectionId: rootCollection.collectionId,
            })
            .expect(200);

        expect(response.body).toStrictEqual({
            ...GET_STRUCTURE_ITEMS_DEFAULT_FIELDS,
            items: expect.arrayContaining([
                {
                    ...COLLECTIONS_DEFAULT_FIELDS,
                    collectionId: nestedCollection.collectionId,
                    parentId: rootCollection.collectionId,
                },
                {
                    ...WORKBOOK_DEFAULT_FIELDS,
                    workbookId: nestedWorkbook.workbookId,
                    collectionId: rootCollection.collectionId,
                },
            ]),
        });
    });
});

describe('Getting root content with "includePermissionsInfo" param', () => {
    test('Get root content', async () => {
        const response = await auth(request(app).get(routes.structureItems), {
            accessBindings: [
                getCollectionBinding(rootCollection.collectionId, 'limitedView'),
                getWorkbookBinding(rootWorkbook.workbookId, 'limitedView'),
            ],
        })
            .query({
                includePermissionsInfo: 'true',
            })
            .expect(200);

        expect(response.body).toStrictEqual({
            ...GET_STRUCTURE_ITEMS_DEFAULT_FIELDS,
            items: expect.arrayContaining([
                {
                    ...COLLECTIONS_DEFAULT_FIELDS,
                    collectionId: rootCollection.collectionId,
                    parentId: null,
                    permissions: {
                        ...COLLECTIONS_DEFAULT_PERMISSIONS,
                        limitedView: true,
                    },
                },
                {
                    ...WORKBOOK_DEFAULT_FIELDS,
                    workbookId: rootWorkbook.workbookId,
                    collectionId: null,
                    permissions: {
                        ...WORKBOOKS_DEFAULT_PERMISSIONS,
                        limitedView: true,
                    },
                },
            ]),
        });
    });
});

describe('Getting root content with "filterString" param', () => {
    test('Get root content', async () => {
        const response = await auth(request(app).get(routes.structureItems), {
            accessBindings: [
                getCollectionBinding(rootCollection.collectionId, 'limitedView'),
                getWorkbookBinding(rootWorkbook.workbookId, 'limitedView'),
            ],
        })
            .query({
                filterString: rootCollection.title,
            })
            .expect(200);

        expect(response.body).toStrictEqual({
            ...GET_STRUCTURE_ITEMS_DEFAULT_FIELDS,
            items: expect.arrayContaining([
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
        const response = await auth(request(app).get(routes.structureItems), {
            userId: testOtherUserId,
            accessBindings: [
                getCollectionBinding(rootCollection.collectionId, 'limitedView'),
                getWorkbookBinding(rootWorkbook.workbookId, 'limitedView'),
            ],
        })
            .query({
                onlyMy: 'true',
            })
            .expect(200);

        expect(response.body).toStrictEqual({
            ...GET_STRUCTURE_ITEMS_DEFAULT_FIELDS,
        });
    });

    test('Get root content with onlyMy = false for other userId', async () => {
        const response = await auth(request(app).get(routes.structureItems), {
            userId: testOtherUserId,
            accessBindings: [
                getCollectionBinding(rootCollection.collectionId, 'limitedView'),
                getWorkbookBinding(rootWorkbook.workbookId, 'limitedView'),
            ],
        })
            .query({
                onlyMy: 'false',
            })
            .expect(200);

        expect(response.body).toStrictEqual({
            ...GET_STRUCTURE_ITEMS_DEFAULT_FIELDS,
            items: expect.arrayContaining([
                {
                    ...COLLECTIONS_DEFAULT_FIELDS,
                    collectionId: rootCollection.collectionId,
                    parentId: null,
                },
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
        const response = await auth(request(app).get(routes.structureItems), {
            accessBindings: [
                getCollectionBinding(rootCollection.collectionId, 'limitedView'),
                getWorkbookBinding(rootWorkbook.workbookId, 'limitedView'),
            ],
        })
            .query({
                mode: 'onlyCollections',
            })
            .expect(200);

        expect(response.body).toStrictEqual({
            ...GET_STRUCTURE_ITEMS_DEFAULT_FIELDS,
            items: expect.arrayContaining([
                {
                    ...COLLECTIONS_DEFAULT_FIELDS,
                    collectionId: rootCollection.collectionId,
                    parentId: null,
                },
            ]),
        });
    });

    test('Get root content with mode = onlyWorkbooks', async () => {
        const response = await auth(request(app).get(routes.structureItems), {
            accessBindings: [
                getCollectionBinding(rootCollection.collectionId, 'limitedView'),
                getWorkbookBinding(rootWorkbook.workbookId, 'limitedView'),
            ],
        })
            .query({
                mode: 'onlyWorkbooks',
            })
            .expect(200);

        expect(response.body).toStrictEqual({
            ...GET_STRUCTURE_ITEMS_DEFAULT_FIELDS,
            items: expect.arrayContaining([
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
    let nextPageToken = '';

    test('Get root content first page', async () => {
        const response = await auth(request(app).get(routes.structureItems), {
            accessBindings: [
                getCollectionBinding(rootCollection.collectionId, 'limitedView'),
                getWorkbookBinding(rootWorkbook.workbookId, 'limitedView'),
                getCollectionBinding(rootCollection2.collectionId, 'limitedView'),
                getWorkbookBinding(rootWorkbook2.workbookId, 'limitedView'),
            ],
        })
            .query({
                pageSize: 3,
            })
            .expect(200);

        nextPageToken = response.body.nextPageToken;

        expect(response.body).toStrictEqual({
            ...GET_STRUCTURE_ITEMS_DEFAULT_FIELDS,
            items: expect.arrayContaining([
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
                {
                    ...WORKBOOK_DEFAULT_FIELDS,
                    workbookId: rootWorkbook.workbookId,
                    collectionId: null,
                },
            ]),
            nextPageToken: expect.any(String),
        });
    });

    test('Get root content second page', async () => {
        const response = await auth(request(app).get(routes.structureItems), {
            accessBindings: [
                getCollectionBinding(rootCollection.collectionId, 'limitedView'),
                getWorkbookBinding(rootWorkbook.workbookId, 'limitedView'),
                getCollectionBinding(rootCollection2.collectionId, 'limitedView'),
                getWorkbookBinding(rootWorkbook2.workbookId, 'limitedView'),
            ],
        })
            .query({
                pageSize: 3,
                page: nextPageToken,
            })
            .expect(200);

        expect(response.body).toStrictEqual({
            ...GET_STRUCTURE_ITEMS_DEFAULT_FIELDS,
            items: expect.arrayContaining([
                {
                    ...WORKBOOK_DEFAULT_FIELDS,
                    workbookId: rootWorkbook2.workbookId,
                    collectionId: null,
                },
            ]),
        });
    });
});

describe('Getting root content with sorting', () => {
    test('Get root content with orderField = title and orderDirection = asc', async () => {
        const response = await auth(request(app).get(routes.structureItems), {
            accessBindings: [
                getCollectionBinding(rootCollection.collectionId, 'limitedView'),
                getWorkbookBinding(rootWorkbook.workbookId, 'limitedView'),
                getCollectionBinding(rootCollection2.collectionId, 'limitedView'),
                getWorkbookBinding(rootWorkbook2.workbookId, 'limitedView'),
            ],
        })
            .query({
                orderField: 'title',
                orderDirection: 'asc',
            })
            .expect(200);

        const {body} = response;

        expect(body.items[0].collectionId).toBe(rootCollection.collectionId);
        expect(body.items[1].collectionId).toBe(rootCollection2.collectionId);

        expect(body.items[2].workbookId).toBe(rootWorkbook.workbookId);
        expect(body.items[3].workbookId).toBe(rootWorkbook2.workbookId);
    });

    test('Get root content with orderField = title and orderDirection = desc', async () => {
        const response = await auth(request(app).get(routes.structureItems), {
            accessBindings: [
                getCollectionBinding(rootCollection.collectionId, 'limitedView'),
                getWorkbookBinding(rootWorkbook.workbookId, 'limitedView'),
                getCollectionBinding(rootCollection2.collectionId, 'limitedView'),
                getWorkbookBinding(rootWorkbook2.workbookId, 'limitedView'),
            ],
        })
            .query({
                orderField: 'title',
                orderDirection: 'desc',
            })
            .expect(200);

        const {body} = response;

        expect(body.items[0].collectionId).toBe(rootCollection2.collectionId);
        expect(body.items[1].collectionId).toBe(rootCollection.collectionId);

        expect(body.items[2].workbookId).toBe(rootWorkbook2.workbookId);
        expect(body.items[3].workbookId).toBe(rootWorkbook.workbookId);
    });

    test('Get root content with orderField = createdAt and orderDirection = asc', async () => {
        const response = await auth(request(app).get(routes.structureItems), {
            accessBindings: [
                getCollectionBinding(rootCollection.collectionId, 'limitedView'),
                getWorkbookBinding(rootWorkbook.workbookId, 'limitedView'),
                getCollectionBinding(rootCollection2.collectionId, 'limitedView'),
                getWorkbookBinding(rootWorkbook2.workbookId, 'limitedView'),
            ],
        })
            .query({
                orderField: 'createdAt',
                orderDirection: 'asc',
            })
            .expect(200);

        const {body} = response;

        expect(body.items[0].collectionId).toBe(rootCollection.collectionId);
        expect(body.items[1].collectionId).toBe(rootCollection2.collectionId);

        expect(body.items[2].workbookId).toBe(rootWorkbook.workbookId);
        expect(body.items[3].workbookId).toBe(rootWorkbook2.workbookId);
    });

    test('Get root content with orderField = createdAt and orderDirection = desc', async () => {
        const response = await auth(request(app).get(routes.structureItems), {
            accessBindings: [
                getCollectionBinding(rootCollection.collectionId, 'limitedView'),
                getWorkbookBinding(rootWorkbook.workbookId, 'limitedView'),
                getCollectionBinding(rootCollection2.collectionId, 'limitedView'),
                getWorkbookBinding(rootWorkbook2.workbookId, 'limitedView'),
            ],
        })
            .query({
                orderField: 'title',
                orderDirection: 'desc',
            })
            .expect(200);

        const {body} = response;

        expect(body.items[0].collectionId).toBe(rootCollection2.collectionId);
        expect(body.items[1].collectionId).toBe(rootCollection.collectionId);

        expect(body.items[2].workbookId).toBe(rootWorkbook2.workbookId);
        expect(body.items[3].workbookId).toBe(rootWorkbook.workbookId);
    });
});
