import request from 'supertest';

import {COLLECTIONS_DEFAULT_FIELDS} from '../../../../models';
import {routes} from '../../../../routes';
import {app, auth, getCollectionBinding, getWorkbookBinding} from '../../auth';
import {createMockCollection, createMockWorkbook, createMockWorkbookEntry} from '../../helpers';

const emptyRootCollection = {
    collectionId: '',
    title: 'Empty root collection',
};

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

const nestedWorkbookEntry = {
    entryId: '',
    name: 'Nested workbook entry',
};

describe('Setup', () => {
    test('Create empty collection', async () => {
        const collection = await createMockCollection({
            title: emptyRootCollection.title,
            parentId: null,
        });
        emptyRootCollection.collectionId = collection.collectionId;
    });

    test('Create root collection', async () => {
        const collection = await createMockCollection({
            title: rootCollection.title,
            parentId: null,
        });
        rootCollection.collectionId = collection.collectionId;
    });

    test('Create nested collection', async () => {
        const collection = await createMockCollection({
            title: nestedCollection.title,
            parentId: rootCollection.collectionId,
        });
        nestedCollection.collectionId = collection.collectionId;
    });

    test('Create nested workbook', async () => {
        const workbook = await createMockWorkbook({
            title: nestedCollection.title,
            collectionId: rootCollection.collectionId,
        });
        nestedWorkbook.workbookId = workbook.workbookId;
    });

    test('Create nested workbook entry', async () => {
        const entry = await createMockWorkbookEntry({
            name: nestedWorkbookEntry.name,
            workbookId: nestedWorkbook.workbookId,
        });
        nestedWorkbookEntry.entryId = entry.entryId;
    });
});

describe('Deleting empty root collection', () => {
    test('Auth error', async () => {
        await request(app)
            .delete(`${routes.collections}/${emptyRootCollection.collectionId}`)
            .expect(401);
    });

    test('Delete without permission error', async () => {
        await auth(
            request(app).delete(`${routes.collections}/${emptyRootCollection.collectionId}`),
        ).expect(403);
    });

    test('Delete with incorrect permission error', async () => {
        await auth(
            request(app).delete(`${routes.collections}/${emptyRootCollection.collectionId}`),
            {
                accessBindings: [
                    getCollectionBinding(emptyRootCollection.collectionId, 'limitedView'),
                ],
            },
        ).expect(403);
    });

    test('Successful delete collection', async () => {
        const response = await auth(
            request(app).delete(`${routes.collections}/${emptyRootCollection.collectionId}`),
            {
                accessBindings: [getCollectionBinding(emptyRootCollection.collectionId, 'delete')],
            },
        ).expect(200);

        expect(response.body).toStrictEqual({
            collections: expect.arrayContaining([
                {
                    ...COLLECTIONS_DEFAULT_FIELDS,
                    collectionId: emptyRootCollection.collectionId,
                    parentId: null,
                },
            ]),
        });
    });

    test('Get deleted collection error', async () => {
        await auth(request(app).get(`${routes.collections}/${emptyRootCollection.collectionId}`), {
            accessBindings: [getCollectionBinding(emptyRootCollection.collectionId, 'limitedView')],
        }).expect(404);
    });
});

describe('Deleting root collection with content', () => {
    test('Successful delete collection', async () => {
        const response = await auth(
            request(app).delete(`${routes.collections}/${rootCollection.collectionId}`),
            {
                accessBindings: [getCollectionBinding(rootCollection.collectionId, 'delete')],
            },
        ).expect(200);

        expect(response.body).toStrictEqual({
            collections: expect.arrayContaining([
                {
                    ...COLLECTIONS_DEFAULT_FIELDS,
                    collectionId: nestedCollection.collectionId,
                    parentId: rootCollection.collectionId,
                },
                {
                    ...COLLECTIONS_DEFAULT_FIELDS,
                    collectionId: rootCollection.collectionId,
                    parentId: null,
                },
            ]),
            // workbooks: [], // TODO: Return list of deleted workbooks
        });
    });

    test('Get deleted collection error', async () => {
        await auth(request(app).get(`${routes.collections}/${rootCollection.collectionId}`), {
            accessBindings: [getCollectionBinding(rootCollection.collectionId, 'limitedView')],
        }).expect(404);
    });

    test('Get deleted nested collection error', async () => {
        await auth(request(app).get(`${routes.collections}/${nestedCollection.collectionId}`), {
            accessBindings: [getCollectionBinding(nestedCollection.collectionId, 'limitedView')],
        }).expect(404);
    });

    test('Get deleted nested workbook error', async () => {
        await auth(request(app).get(`${routes.workbooks}/${nestedWorkbook.workbookId}`), {
            accessBindings: [getWorkbookBinding(nestedWorkbook.workbookId, 'limitedView')],
        }).expect(404);
    });

    test('Get deleted workbook entry error', async () => {
        await auth(request(app).get(`${routes.entries}/${nestedWorkbookEntry.entryId}`), {
            accessBindings: [getWorkbookBinding(nestedWorkbook.workbookId, 'limitedView')],
        }).expect(404);
    });
});
