import request from 'supertest';

import {Entry} from '../../../../../../db/models/new/entry';
import {EntryScope} from '../../../../../../db/models/new/entry/types';
import {WorkbookModel, WorkbookModelColumn} from '../../../../../../db/models/new/workbook';
import Utils from '../../../../../../utils';
import {testUserId} from '../../../../constants';
import {routes} from '../../../../routes';
import {app, appNodekit, auth, getWorkbookBinding, testTenantId} from '../../auth';
import {PlatformRole} from '../../roles';

const workbookTitle = 'Favourite Workbook';

let workbookEntryIdRaw: string;
let workbookEntryId: string;
let workbookId: string;

describe('Rename entries', () => {
    beforeAll(async () => {
        const {getId} = appNodekit.ctx.get('registry').getDbInstance();

        const workbook = await WorkbookModel.query(WorkbookModel.primary)
            .insert({
                [WorkbookModelColumn.Title]: workbookTitle,
                [WorkbookModelColumn.TitleLower]: workbookTitle.toLowerCase(),
                [WorkbookModelColumn.TenantId]: testTenantId,
                [WorkbookModelColumn.CreatedBy]: testUserId,
                [WorkbookModelColumn.UpdatedBy]: testUserId,
            })
            .returning('*')
            .timeout(WorkbookModel.DEFAULT_QUERY_TIMEOUT);

        workbookId = Utils.encodeId(workbook[WorkbookModelColumn.WorkbookId]);

        workbookEntryIdRaw = await getId();

        workbookEntryId = Utils.encodeId(workbookEntryIdRaw);

        await Entry.query(Entry.primary).insert({
            workbookId: workbook[WorkbookModelColumn.WorkbookId],
            entryId: workbookEntryIdRaw,
            key: `${workbookEntryIdRaw}/entry in workbook`,
            displayKey: `${workbookEntryIdRaw}/Entry In Workbook`,
            name: 'Entry In Workbook',
            scope: EntryScope.Dataset,
            type: '',
            tenantId: testTenantId,
            createdBy: testUserId,
            updatedBy: testUserId,
        });
    });

    test('Rename entry in workbook', async () => {
        const newName = 'Capitalized Name';

        const {body} = await auth(
            request(app).post(`${routes.entries}/${workbookEntryId}/rename`),
            {
                accessBindings: [
                    getWorkbookBinding(workbookId, 'limitedView'),
                    getWorkbookBinding(workbookId, 'view'),
                    getWorkbookBinding(workbookId, 'update'),
                    getWorkbookBinding(workbookId, 'updateAccessBindings'),
                ],
            },
        )
            .send({
                name: newName,
            })
            .expect(200);

        expect(body).toHaveLength(1);

        expect(body[0]).toMatchObject({
            entryId: workbookEntryId,
            key: `${workbookEntryIdRaw}/${newName}`,
            tenantId: testTenantId,
        });
    });

    test('Rename entry in workbook by Visitor should fail with 403', async () => {
        await auth(request(app).post(`${routes.entries}/${workbookEntryId}/rename`), {
            role: PlatformRole.Visitor,
        })
            .send({
                name: 'anything',
            })
            .expect(403);
    });
});
