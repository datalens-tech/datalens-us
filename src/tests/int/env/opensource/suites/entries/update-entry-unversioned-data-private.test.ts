import request from 'supertest';

import {routes} from '../../../../routes';
import {app, authPrivateRoute} from '../../auth';
import {createMockWorkbook, createMockWorkbookEntry} from '../../helpers';

let entryId: string;

const notExistingEntryId = 'fvsb9zbfkqos2';

describe('Update entry unversioned data (private)', () => {
    test('[Setup test data] Create workbook and entry for unversioned data tests', async () => {
        const workbook = await createMockWorkbook({
            title: 'Workbook for unversioned data',
        });

        const entry = await createMockWorkbookEntry({
            name: 'Entry for unversioned data',
            workbookId: workbook.workbookId,
            scope: 'dataset',
            type: 'dataset',
        });

        entryId = entry.entryId;
    });

    test('Update unversioned data successfully', async () => {
        const newUnversionedData = {
            customField: 'customValue',
            nestedObject: {
                key1: 'value1',
                key2: 123,
            },
            arrayField: [1, 2, 3],
        };

        const result = await authPrivateRoute(
            request(app).post(routes.privateUpdateEntryUnversionedData(entryId)),
        )
            .send({
                unversionedData: newUnversionedData,
            })
            .expect(200);

        expect(result.body.unversionedData).toEqual(newUnversionedData);
    });

    test('Update unversioned data for non-existing entry returns error', async () => {
        await authPrivateRoute(
            request(app).post(routes.privateUpdateEntryUnversionedData(notExistingEntryId)),
        )
            .send({
                unversionedData: {test: 'data'},
            })
            .expect(404);
    });
});
