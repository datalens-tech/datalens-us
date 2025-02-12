import request from 'supertest';

import {WORKBOOK_DEFAULT_FIELDS} from '../../../../models';
import {routes} from '../../../../routes';
import {app, auth, getWorkbookBinding} from '../../auth';
import {createMockCollection, createMockWorkbook, createMockWorkbookEntry} from '../../helpers';

const emptyRootWorkbook = {
    collectionId: null,
    workbookId: '',
    title: 'Empty root workbook',
};

const emptyRootWorkbook2 = {
    collectionId: null,
    workbookId: '',
    title: 'Empty Root workbook 2',
};

const rootCollectionWithContent = {
    collectionId: '',
    title: 'Root collection',
};

const workbookWithinCollection = {
    collectionId: '',
    workbookId: '',
    title: 'Workbook within Collection',
};

const workbookWithinCollection2 = {
    collectionId: '',
    workbookId: '',
    title: 'Workbook within Collection 2',
};

const entries: {entryId: string; workbookId: string}[] = [];

describe('Setup', () => {
    test('Create empty workbooks', async () => {
        const workbook = await createMockWorkbook({
            title: emptyRootWorkbook.title,
            collectionId: null,
        });

        emptyRootWorkbook.workbookId = workbook.workbookId;

        const workbook2 = await createMockWorkbook({
            title: emptyRootWorkbook2.title,
            collectionId: null,
        });

        emptyRootWorkbook2.workbookId = workbook2.workbookId;
    });

    test('Create root collections with content', async () => {
        const collection = await createMockCollection({
            title: rootCollectionWithContent.title,
            parentId: null,
        });
        rootCollectionWithContent.collectionId = collection.collectionId;
    });

    test('Create workbooks within collection', async () => {
        const workbook = await createMockWorkbook({
            title: workbookWithinCollection.title,
            collectionId: rootCollectionWithContent.collectionId,
        });

        workbookWithinCollection.collectionId = workbook.collectionId;
        workbookWithinCollection.workbookId = workbook.workbookId;

        const workbook2 = await createMockWorkbook({
            title: workbookWithinCollection2.title,
            collectionId: rootCollectionWithContent.collectionId,
        });

        workbookWithinCollection2.collectionId = workbook2.collectionId;
        workbookWithinCollection2.workbookId = workbook2.workbookId;
    });

    test('Create entries in workbooks', async () => {
        for (let j = 0; j < 10; j++) {
            const workbookId =
                j % 2 ? workbookWithinCollection.workbookId : workbookWithinCollection2.workbookId;

            const entry = await createMockWorkbookEntry({
                name: 'Title' + j,
                workbookId,
            });

            entries.push(entry);
        }
    });
});

describe('Deleting empty workbooks in the root', () => {
    test('Auth error', async () => {
        await request(app)
            .delete(routes.deleteWorkbooks)
            .send({
                workbookIds: [emptyRootWorkbook.workbookId, emptyRootWorkbook2.workbookId],
            })
            .expect(401);
    });

    test('Delete without permission error', async () => {
        await auth(request(app).delete(routes.deleteWorkbooks))
            .send({
                workbookIds: [emptyRootWorkbook.workbookId, emptyRootWorkbook2.workbookId],
            })
            .expect(403);
    });

    test('Delete with incorrect permission error', async () => {
        await auth(request(app).delete(routes.deleteWorkbooks), {
            accessBindings: [
                getWorkbookBinding(emptyRootWorkbook.workbookId, 'limitedView'),
                getWorkbookBinding(emptyRootWorkbook2.workbookId, 'limitedView'),
            ],
        })
            .send({
                workbookIds: [emptyRootWorkbook.workbookId, emptyRootWorkbook2.workbookId],
            })
            .expect(403);
    });

    test('Successful delete workbooks', async () => {
        const response = await auth(request(app).delete(routes.deleteWorkbooks), {
            accessBindings: [
                getWorkbookBinding(emptyRootWorkbook.workbookId, 'delete'),
                getWorkbookBinding(emptyRootWorkbook2.workbookId, 'delete'),
            ],
        })
            .send({
                workbookIds: [emptyRootWorkbook.workbookId, emptyRootWorkbook2.workbookId],
            })
            .expect(200);

        expect(response.body).toStrictEqual({
            workbooks: expect.toIncludeSameMembers([
                {
                    ...WORKBOOK_DEFAULT_FIELDS,
                    collectionId: null,
                    title: emptyRootWorkbook.title,
                    workbookId: emptyRootWorkbook.workbookId,
                },
                {
                    ...WORKBOOK_DEFAULT_FIELDS,
                    collectionId: null,
                    title: emptyRootWorkbook2.title,
                    workbookId: emptyRootWorkbook2.workbookId,
                },
            ]),
        });
    });

    test('Get deleted workbooks error', async () => {
        await auth(request(app).get(`${routes.workbooks}/${emptyRootWorkbook.workbookId}`), {
            accessBindings: [getWorkbookBinding(emptyRootWorkbook.workbookId, 'limitedView')],
        }).expect(404);

        await auth(request(app).get(`${routes.workbooks}/${emptyRootWorkbook2.workbookId}`), {
            accessBindings: [getWorkbookBinding(emptyRootWorkbook2.workbookId, 'limitedView')],
        }).expect(404);
    });
});

describe('Deleting workbooks within collection and with content', () => {
    test('Delete with incorrect collection permission error', async () => {
        await auth(request(app).delete(routes.deleteWorkbooks), {
            accessBindings: [
                getWorkbookBinding(workbookWithinCollection.workbookId, 'limitedView'),
                getWorkbookBinding(workbookWithinCollection2.workbookId, 'limitedView'),
            ],
        })
            .send({
                workbookIds: [
                    workbookWithinCollection.workbookId,
                    workbookWithinCollection2.workbookId,
                ],
            })
            .expect(403);
    });

    test('Successful delete workbooks', async () => {
        const response = await auth(request(app).delete(routes.deleteWorkbooks), {
            accessBindings: [
                getWorkbookBinding(workbookWithinCollection.workbookId, 'delete'),
                getWorkbookBinding(workbookWithinCollection2.workbookId, 'delete'),
            ],
        })
            .send({
                workbookIds: [
                    workbookWithinCollection.workbookId,
                    workbookWithinCollection2.workbookId,
                ],
            })
            .expect(200);

        expect(response.body).toStrictEqual({
            workbooks: expect.toIncludeSameMembers([
                {
                    ...WORKBOOK_DEFAULT_FIELDS,
                    collectionId: rootCollectionWithContent.collectionId,
                    title: workbookWithinCollection.title,
                    workbookId: workbookWithinCollection.workbookId,
                },
                {
                    ...WORKBOOK_DEFAULT_FIELDS,
                    collectionId: rootCollectionWithContent.collectionId,
                    title: workbookWithinCollection2.title,
                    workbookId: workbookWithinCollection2.workbookId,
                },
            ]),
        });
    });

    test('Get deleted workbooks error', async () => {
        await auth(request(app).get(`${routes.workbooks}/${workbookWithinCollection.workbookId}`), {
            accessBindings: [
                getWorkbookBinding(workbookWithinCollection.workbookId, 'limitedView'),
            ],
        }).expect(404);

        await auth(request(app).get(`${routes.workbooks}/${workbookWithinCollection.workbookId}`), {
            accessBindings: [
                getWorkbookBinding(workbookWithinCollection.workbookId, 'limitedView'),
            ],
        }).expect(404);
    });

    test('Get deleted workbook entries error', async () => {
        for (const entry of entries) {
            await auth(request(app).get(`${routes.entries}/${entry.entryId}`), {
                accessBindings: [getWorkbookBinding(entry.workbookId, 'limitedView')],
            }).expect(404);
        }
    });
});
