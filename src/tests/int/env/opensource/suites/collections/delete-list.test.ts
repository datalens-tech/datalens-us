import request from 'supertest';

import {COLLECTIONS_DEFAULT_FIELDS} from '../../../../models';
import {routes} from '../../../../routes';
import {app, auth} from '../../auth';
import {createMockCollection, createMockWorkbook, createMockWorkbookEntry} from '../../helpers';
import {OpensourceRole} from '../../roles';

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

    test('Successful delete collections', async () => {
        const response = await auth(request(app).delete(routes.deleteCollections), {
            role: OpensourceRole.Editor,
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
            collections: expect.toIncludeSameMembers([
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
            await auth(request(app).get(`${routes.collections}/${collectionId}`)).expect(404);
        }
    });

    test('Get deleted workbooks error', async () => {
        for (const workbookId of workbookIds) {
            await auth(request(app).get(`${routes.workbooks}/${workbookId}`)).expect(404);
        }
    });

    test('Get deleted workbook entries error', async () => {
        for (const entry of entries) {
            await auth(request(app).get(`${routes.entries}/${entry.entryId}`)).expect(404);
        }
    });
});
