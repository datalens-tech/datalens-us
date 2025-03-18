import request from 'supertest';

import {getId} from '../../../../../../db';
import {Entry} from '../../../../../../db/models/new/entry';
import {EntryScope} from '../../../../../../db/models/new/entry/types';
import {WorkbookModel, WorkbookModelColumn} from '../../../../../../db/models/new/workbook';
import Utils from '../../../../../../utils';
import {testUserId} from '../../../../constants';
import {routes} from '../../../../routes';
import {app, authMasterToken, testTenantId} from '../../auth';

const workbookTitle = 'Favourite Workbook';
const folderName = 'F1 2024 results';
const folderDisplayKey = `${folderName}/`;
const entryInFolderName = 'drivers';
const entryInFolderDisplayKey = `${folderDisplayKey}${entryInFolderName}`;
const newFolderName = 'Some strange Folder name';

let folderEntryIdRaw: string;
let workbookEntryIdRaw: string;
let entryInFolderIdRaw: string;
let folderEntryId: string;
let entryInFolderId: string;
let workbookEntryId: string;

describe('Rename entries', () => {
    beforeAll(async () => {
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

        [folderEntryIdRaw, workbookEntryIdRaw, entryInFolderIdRaw] = await Promise.all([
            getId(),
            getId(),
            getId(),
        ]);

        folderEntryId = Utils.encodeId(folderEntryIdRaw);
        workbookEntryId = Utils.encodeId(workbookEntryIdRaw);
        entryInFolderId = Utils.encodeId(entryInFolderIdRaw);

        await Entry.query(Entry.primary).insert([
            {
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
            },
            {
                entryId: folderEntryIdRaw,
                key: folderDisplayKey.toLowerCase(),
                displayKey: folderDisplayKey,
                name: folderName,
                scope: EntryScope.Folder,
                type: '',
                tenantId: testTenantId,
                createdBy: testUserId,
                updatedBy: testUserId,
            },
            {
                entryId: entryInFolderIdRaw,
                key: entryInFolderDisplayKey.toLowerCase(),
                displayKey: entryInFolderDisplayKey,
                name: entryInFolderName,
                scope: EntryScope.Dataset,
                type: '',
                tenantId: testTenantId,
                createdBy: testUserId,
                updatedBy: testUserId,
            },
        ]);
    });

    test('Rename folder', async () => {
        const {body} = await authMasterToken(
            request(app).post(`${routes.privateEntries}/${folderEntryId}/rename`),
        )
            .send({
                name: newFolderName,
            })
            .expect(200);

        expect(body).toHaveLength(2);

        expect(body).toIncludeAllPartialMembers([
            {
                entryId: folderEntryId,
                key: `${newFolderName}/`,
                tenantId: testTenantId,
            },
            {
                entryId: entryInFolderId,
                key: `${newFolderName}/${entryInFolderName}`,
                tenantId: testTenantId,
            },
        ]);
    });

    test('Rename entry in workbook', async () => {
        const newName = 'Capitalized Name';

        const {body} = await authMasterToken(
            request(app).post(`${routes.privateEntries}/${workbookEntryId}/rename`),
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

    test('Rename entry in Folder', async () => {
        const newName = 'Teams';

        const {body} = await authMasterToken(
            request(app).post(`${routes.privateEntries}/${entryInFolderId}/rename`),
        )
            .send({
                name: newName,
            })
            .expect(200);

        expect(body).toHaveLength(1);

        expect(body[0]).toMatchObject({
            entryId: entryInFolderId,
            key: `${newFolderName}/${newName}`,
            tenantId: testTenantId,
        });
    });
});
