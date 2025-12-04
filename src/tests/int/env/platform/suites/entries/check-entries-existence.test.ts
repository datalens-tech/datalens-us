import request from 'supertest';

import {routes} from '../../../../routes';
import {app, auth} from '../../auth';
import {createMockWorkbook, createMockWorkbookEntry} from '../../helpers';

let entryId: string;

let entryId2: string;

const notExistingEntryId = 'fvsb9zbfkqos2';
const invalidEntryId = 'invalid-id-123';

describe('Check entries existence', () => {
    test('Setup test data', async () => {
        const workbook = await createMockWorkbook({title: 'My workbook'});

        const entry = await createMockWorkbookEntry({
            name: 'Workbook entry',
            workbookId: workbook.workbookId,
            scope: 'dataset',
            type: 'wizard-dataset',
        });

        entryId = entry.entryId;

        const entry2 = await createMockWorkbookEntry({
            name: 'Workbook entry 2',
            workbookId: workbook.workbookId,
            scope: 'widget',
            type: 'wizard-widget',
        });

        entryId2 = entry2.entryId;
    });

    test('Check entries existence without auth error', async () => {
        await request(app).post(routes.checkEntriesExistence).expect(401);
    });

    test('Check mixed scenario: existing, non-existing, and invalid IDs', async () => {
        const response = await auth(request(app).post(routes.checkEntriesExistence))
            .send({
                entryIds: [entryId, entryId2, notExistingEntryId, invalidEntryId],
            })
            .expect(200);

        expect(response.body).toStrictEqual({
            [entryId]: true,
            [entryId2]: true,
            [notExistingEntryId]: false,
            [invalidEntryId]: false,
        });
    });
});
