import request from 'supertest';
import {app, auth, getCollectionBinding, getWorkbookBinding} from '../../auth';
import {createMockCollection, createMockWorkbook, createMockWorkbookEntry} from '../../helpers';
import {routes} from '../../../../routes';
import {COLLECTIONS_DEFAULT_FIELDS} from '../../../../models';

const emptyRootCollection = {
    collectionId: '',
    title: 'Empty root collection',
};

const rootCollectionWithContent1 = {
    collectionId: '',
    title: 'Root collection 1',
};

const rootCollectionWithContent2 = {
    collectionId: '',
    title: 'Root collection 2',
};

const nestedCollections: {collectionId: string; parentId: string}[] = [];
const workbookIds: string[] = [];
const entries: {entryId: string; workbookId: string}[] = [];

describe('Setup', () => {
    test('Create empty collection', async () => {
        const collection = await createMockCollection({
            title: emptyRootCollection.title,
            parentId: null,
        });
        emptyRootCollection.collectionId = collection.collectionId;
    });

    test('Create root collections with content', async () => {
        const collection1 = await createMockCollection({
            title: rootCollectionWithContent1.title,
            parentId: null,
        });
        rootCollectionWithContent1.collectionId = collection1.collectionId;

        const collection2 = await createMockCollection({
            title: rootCollectionWithContent2.title,
            parentId: null,
        });
        rootCollectionWithContent2.collectionId = collection2.collectionId;
    });

    test('Create nested collections', async () => {
        for (let i = 0; i < 6; i++) {
            const collectionId =
                i % 2
                    ? rootCollectionWithContent1.collectionId
                    : rootCollectionWithContent2.collectionId;

            const collection = await createMockCollection({
                title: 'Title' + i,
                parentId: collectionId,
            });

            nestedCollections.push({
                collectionId: collection.collectionId,
                parentId: collectionId,
            });
        }
    });

    test('Create nested workbooks', async () => {
        for (const {collectionId} of nestedCollections) {
            for (let j = 0; j < 4; j++) {
                const workbook = await createMockWorkbook({
                    title: 'Title' + j,
                    collectionId,
                });

                workbookIds.push(workbook.workbookId);
            }
        }
    });

    test('Create entries in workbooks', async () => {
        for (const workbookId of workbookIds) {
            for (let j = 0; j < 2; j++) {
                const entry = await createMockWorkbookEntry({
                    name: 'Title' + j,
                    workbookId,
                });

                entries.push(entry);
            }
        }
    });
});

describe('Deleting empty and with content collections', () => {
    test('Auth error', async () => {
        await request(app)
            .delete(routes.deleteCollections)
            .send({
                collectionIds: [
                    rootCollectionWithContent1.collectionId,
                    rootCollectionWithContent2.collectionId,
                    emptyRootCollection.collectionId,
                ],
            })
            .expect(401);
    });

    test('Delete without permission error', async () => {
        await auth(request(app).delete(routes.deleteCollections))
            .send({
                collectionIds: [
                    rootCollectionWithContent1.collectionId,
                    rootCollectionWithContent2.collectionId,
                    emptyRootCollection.collectionId,
                ],
            })
            .expect(403);
    });

    test('Delete with incorrect permission error', async () => {
        await auth(request(app).delete(routes.deleteCollections), {
            accessBindings: [
                getCollectionBinding(rootCollectionWithContent1.collectionId, 'limitedView'),
                getCollectionBinding(rootCollectionWithContent2.collectionId, 'limitedView'),
            ],
        })
            .send({
                collectionIds: [
                    rootCollectionWithContent1.collectionId,
                    rootCollectionWithContent2.collectionId,
                    emptyRootCollection.collectionId,
                ],
            })
            .expect(403);
    });

    test('Successful delete collections', async () => {
        const response = await auth(request(app).delete(routes.deleteCollections), {
            accessBindings: [
                getCollectionBinding(rootCollectionWithContent1.collectionId, 'delete'),
                getCollectionBinding(rootCollectionWithContent2.collectionId, 'delete'),
                getCollectionBinding(emptyRootCollection.collectionId, 'delete'),
            ],
        })
            .send({
                collectionIds: [
                    rootCollectionWithContent1.collectionId,
                    rootCollectionWithContent2.collectionId,
                    emptyRootCollection.collectionId,
                ],
            })
            .expect(200);

        const collections = nestedCollections.map((collection) => {
            return {...COLLECTIONS_DEFAULT_FIELDS, ...collection};
        });

        expect(response.body).toStrictEqual({
            collections: expect.arrayContaining([
                ...collections,
                {
                    ...COLLECTIONS_DEFAULT_FIELDS,
                    collectionId: emptyRootCollection.collectionId,
                    parentId: null,
                },
                {
                    ...COLLECTIONS_DEFAULT_FIELDS,
                    collectionId: rootCollectionWithContent1.collectionId,
                    parentId: null,
                },
                {
                    ...COLLECTIONS_DEFAULT_FIELDS,
                    collectionId: rootCollectionWithContent2.collectionId,
                    parentId: null,
                },
            ]),
        });
    });

    test('Get deleted collections error', async () => {
        const nestedCollectionIds = nestedCollections.map((collection) => collection.collectionId);

        for (const collectionId of [
            ...nestedCollectionIds,
            rootCollectionWithContent1.collectionId,
            rootCollectionWithContent2.collectionId,
            emptyRootCollection.collectionId,
        ]) {
            await auth(request(app).get(`${routes.collections}/${collectionId}`), {
                accessBindings: [getCollectionBinding(collectionId, 'limitedView')],
            }).expect(404);
        }
    });

    test('Get deleted workbooks error', async () => {
        for (const workbookId of workbookIds) {
            await auth(request(app).get(`${routes.workbooks}/${workbookId}`), {
                accessBindings: [getWorkbookBinding(workbookId, 'limitedView')],
            }).expect(404);
        }
    });

    test('Get deleted workbook entries error', async () => {
        for (const entry of entries) {
            await auth(request(app).get(`${routes.entries}/${entry.entryId}`), {
                accessBindings: [getWorkbookBinding(entry.workbookId, 'limitedView')],
            }).expect(404);
        }
    });
});
