import request from 'supertest';
import {app, auth, getWorkbookBinding} from '../../auth';
import {testUserId} from '../../constants';
import {OpensourceRole} from '../../roles';
import {WORKBOOK_DEFAULT_FIELDS, OPERATION_DEFAULT_FIELDS} from '../../models';

const workbooksData = {
    id: '',
    title: 'Test workbook title 1',
    description: 'Test workbook description 1',
};

describe('Workbooks', () => {
    test('Create workbook without permissions error', async () => {
        await request(app)
            .post('/v2/workbooks')
            .send({
                title: workbooksData.title,
                description: workbooksData.description,
            })
            .expect(401);
    });

    test('Create workbook without Editor access error', async () => {
        await auth(request(app).post('/v2/workbooks'))
            .send({
                title: workbooksData.title,
                description: workbooksData.description,
            })
            .expect(403);
    });

    test('Create workbook', async () => {
        const response1 = await auth(request(app).post('/v2/workbooks'), {
            role: OpensourceRole.Editor,
        })
            .send({
                title: workbooksData.title,
                description: workbooksData.description,
            })
            .expect(200);

        const {body: body1} = response1;

        workbooksData.id = body1.workbookId;

        expect(body1).toStrictEqual({
            ...WORKBOOK_DEFAULT_FIELDS,
            createdBy: testUserId,
            updatedBy: testUserId,
            description: workbooksData.description,
            title: workbooksData.title,
            operation: OPERATION_DEFAULT_FIELDS,
        });
    });

    test('Get workbook by workbookId', async () => {
        const response = await auth(request(app).get(`/v2/workbooks/${workbooksData.id}`), {
            accessBindings: [getWorkbookBinding(workbooksData.id, 'limitedView')],
        }).expect(200);

        const {body} = response;

        expect(body).toStrictEqual({
            ...WORKBOOK_DEFAULT_FIELDS,
            createdBy: testUserId,
            updatedBy: testUserId,
            description: workbooksData.description,
            title: workbooksData.title,
            workbookId: workbooksData.id,
        });
    });
});
