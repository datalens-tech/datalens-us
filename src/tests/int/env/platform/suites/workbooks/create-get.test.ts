import request from 'supertest';

import {
    COLLECTIONS_DEFAULT_FIELDS,
    OPERATION_DEFAULT_FIELDS,
    WORKBOOK_DEFAULT_FIELDS,
} from '../../../../models';
import {routes} from '../../../../routes';
import {app, auth, getCollectionBinding, getWorkbookBinding} from '../../auth';
import {PlatformRole} from '../../roles';

const otherWorkbookId = 'other-workbook-id';

let rootWorkbookId: string;
let collectionId: string;
const title = 'Test workbook in root';
const description = 'Test workbook in root description';

describe('Creating workbook in root', () => {
    test('Create workbook auth errors', async () => {
        await request(app).post(routes.workbooks).send({}).expect(401);

        await auth(request(app).post(routes.workbooks))
            .send({
                title,
                description,
            })
            .expect(403);
    });

    test('Create workbook validation errors', async () => {
        await auth(request(app).post(routes.workbooks)).expect(400);
    });

    test('Create workbook in root', async () => {
        const createResponse = await auth(request(app).post(routes.workbooks), {
            role: PlatformRole.Creator,
        })
            .send({
                title,
                description,
            })
            .expect(200);

        rootWorkbookId = createResponse.body.workbookId;

        expect(createResponse.body).toStrictEqual({
            ...WORKBOOK_DEFAULT_FIELDS,
            title,
            description,
            collectionId: null,
            operation: OPERATION_DEFAULT_FIELDS,
        });
    });

    test('Get workbook auth errors', async () => {
        await request(app).get(`${routes.workbooks}/${rootWorkbookId}`).expect(401);

        await auth(request(app).get(`${routes.workbooks}/${rootWorkbookId}`)).expect(403);

        await auth(request(app).get(`${routes.workbooks}/${rootWorkbookId}`), {
            accessBindings: [getWorkbookBinding(otherWorkbookId, 'limitedView')],
        }).expect(403);
    });

    test('Get workbook in root', async () => {
        const getResponse = await auth(request(app).get(`${routes.workbooks}/${rootWorkbookId}`), {
            accessBindings: [getWorkbookBinding(rootWorkbookId, 'limitedView')],
        }).expect(200);

        expect(getResponse.body).toStrictEqual({
            ...WORKBOOK_DEFAULT_FIELDS,
            workbookId: rootWorkbookId,
            title,
            description,
            collectionId: null,
        });
    });
});

describe('Creating collection', () => {
    const curTitle = 'Test collection';
    const curDescription = 'Test collection description';

    test('Create collection auth errors', async () => {
        await request(app).post(routes.collections).send({}).expect(401);

        await auth(request(app).post(routes.collections))
            .send({
                title: curTitle,
                description: curDescription,
                parentId: null,
            })
            .expect(403);
    });

    test('Create collection validation errors', async () => {
        await auth(request(app).post(routes.collections)).expect(400);
    });

    test('Create collection', async () => {
        const createResponse = await auth(request(app).post(routes.collections), {
            role: PlatformRole.Creator,
        })
            .send({
                title: curTitle,
                description: curDescription,
                parentId: null,
            })
            .expect(200);

        collectionId = createResponse.body.collectionId;

        expect(createResponse.body).toStrictEqual({
            ...COLLECTIONS_DEFAULT_FIELDS,
            title: curTitle,
            description: curDescription,
            parentId: null,
            operation: OPERATION_DEFAULT_FIELDS,
        });
    });

    test('Get collection auth errors', async () => {
        await request(app).get(`${routes.collections}/${collectionId}`).expect(401);

        await auth(request(app).get(`${routes.collections}/${collectionId}`)).expect(403);

        await auth(request(app).get(`${routes.collections}/${collectionId}`), {
            accessBindings: [getCollectionBinding(otherWorkbookId, 'limitedView')],
        }).expect(403);

        await auth(request(app).get(`${routes.collections}/${collectionId}`), {
            accessBindings: [getWorkbookBinding(collectionId, 'limitedView')],
        }).expect(403);
    });

    test('Get collection', async () => {
        const getResponse = await auth(request(app).get(`${routes.collections}/${collectionId}`), {
            accessBindings: [getCollectionBinding(collectionId, 'limitedView')],
        }).expect(200);

        expect(getResponse.body).toStrictEqual({
            ...COLLECTIONS_DEFAULT_FIELDS,
            collectionId,
            title: curTitle,
            description: curDescription,
            parentId: null,
        });
    });
});

describe('Creating workbook in collection', () => {
    const curTitle = 'Test workbook in collection';
    const curDescription = 'Test workbook in root collection';

    test('Create workbook in collection auth errors', async () => {
        await auth(
            request(app).post(routes.workbooks).send({
                title: curTitle,
                description: curDescription,
                collectionId,
            }),
            {
                accessBindings: [getCollectionBinding(collectionId, 'createCollection')],
            },
        ).expect(403);
    });

    test('Create workbook in collection', async () => {
        const createResponse = await auth(request(app).post(routes.workbooks), {
            accessBindings: [getCollectionBinding(collectionId, 'createWorkbook')],
        })
            .send({
                title: curTitle,
                description: curDescription,
                collectionId,
            })
            .expect(200);

        expect(createResponse.body).toStrictEqual({
            ...WORKBOOK_DEFAULT_FIELDS,
            title: curTitle,
            description: curDescription,
            collectionId,
            operation: OPERATION_DEFAULT_FIELDS,
        });
    });
});

describe('Deleting workbook in root', () => {
    test('Delete workbook auth errors', async () => {
        await request(app).delete(`${routes.workbooks}/${rootWorkbookId}`).expect(401);

        await auth(request(app).delete(`${routes.workbooks}/${rootWorkbookId}`)).expect(403);

        await auth(request(app).delete(`${routes.workbooks}/${rootWorkbookId}`), {
            accessBindings: [getCollectionBinding(otherWorkbookId, 'delete')],
        }).expect(403);

        await auth(request(app).delete(`${routes.workbooks}/${rootWorkbookId}`), {
            accessBindings: [getCollectionBinding(rootWorkbookId, 'limitedView')],
        }).expect(403);
    });

    test('Delete workbook in root', async () => {
        const deleteResponse = await auth(
            request(app).delete(`${routes.workbooks}/${rootWorkbookId}`),
            {
                accessBindings: [getWorkbookBinding(rootWorkbookId, 'delete')],
            },
        ).expect(200);

        expect(deleteResponse.body).toMatchObject({
            ...WORKBOOK_DEFAULT_FIELDS,
            workbookId: rootWorkbookId,
            title,
            description,
            collectionId: null,
        });
    });
});
