import request from 'supertest';

import {routes} from '../../../../routes';
import {app, auth} from '../../auth';
import {createMockWorkbook, createMockWorkbookEntry} from '../../helpers';
import {OpensourceRole} from '../../roles';

const notExistingEntryId = 'fvsb9zbfkqos2';
const accessDescription = 'To get access, contact the workbook owner';

describe('Get entry access description', () => {
    let workbookId: string;
    let dashEntryId: string;
    let widgetEntryId: string;

    beforeAll(async () => {
        const workbook = await createMockWorkbook({title: 'Access description workbook'});
        workbookId = workbook.workbookId;

        const dashEntry = await createMockWorkbookEntry({
            name: 'Dash with access description',
            workbookId,
            scope: 'dash',
            type: 'dash-type',
            data: {accessDescription},
        });
        dashEntryId = dashEntry.entryId;

        const widgetEntry = await createMockWorkbookEntry({
            name: 'Widget with accessDescription in data',
            workbookId,
            scope: 'widget',
            type: 'graph_wizard_node',
            data: {accessDescription},
        });
        widgetEntryId = widgetEntry.entryId;
    });

    test('Returns 401 without auth', async () => {
        await request(app).get(`${routes.entries}/${dashEntryId}/access-description`).expect(401);
    });

    test('Returns 404 for non-existing entry', async () => {
        await auth(
            request(app).get(`${routes.entries}/${notExistingEntryId}/access-description`),
        ).expect(404);
    });

    test('Returns access description for a dash', async () => {
        const {body} = await auth(
            request(app).get(`${routes.entries}/${dashEntryId}/access-description`),
        ).expect(200);

        expect(body).toStrictEqual({accessDescription});
    });

    test('Returns null access description for a non-dash entry', async () => {
        const {body} = await auth(
            request(app).get(`${routes.entries}/${widgetEntryId}/access-description`),
        ).expect(200);

        expect(body).toStrictEqual({accessDescription: null});
    });

    describe('Branch query parameter', () => {
        const publishedAccessDescription = 'Published: contact the workbook owner';
        const savedAccessDescription = 'Saved: contact the workbook owner';

        let branchedEntryId: string;

        beforeAll(async () => {
            const entry = await createMockWorkbookEntry({
                name: 'Dash with branched access description',
                workbookId,
                scope: 'dash',
                type: 'dash-type',
                data: {accessDescription: publishedAccessDescription},
                mode: 'publish',
            });
            branchedEntryId = entry.entryId;

            await auth(request(app).post(`${routes.entries}/${branchedEntryId}`), {
                role: OpensourceRole.Editor,
            })
                .send({data: {accessDescription: savedAccessDescription}, mode: 'save'})
                .expect(200);
        });

        test('Returns saved revision access description by default', async () => {
            const {body} = await auth(
                request(app).get(`${routes.entries}/${branchedEntryId}/access-description`),
            ).expect(200);

            expect(body).toStrictEqual({accessDescription: savedAccessDescription});
        });

        test('Returns saved revision access description with branch=saved', async () => {
            const {body} = await auth(
                request(app).get(
                    `${routes.entries}/${branchedEntryId}/access-description?branch=saved`,
                ),
            ).expect(200);

            expect(body).toStrictEqual({accessDescription: savedAccessDescription});
        });

        test('Returns published revision access description with branch=published', async () => {
            const {body} = await auth(
                request(app).get(
                    `${routes.entries}/${branchedEntryId}/access-description?branch=published`,
                ),
            ).expect(200);

            expect(body).toStrictEqual({accessDescription: publishedAccessDescription});
        });

        test('Returns 404 with branch=published for a never published entry', async () => {
            await auth(
                request(app).get(
                    `${routes.entries}/${dashEntryId}/access-description?branch=published`,
                ),
            ).expect(404);
        });

        test('Returns 400 for an invalid branch value', async () => {
            await auth(
                request(app).get(
                    `${routes.entries}/${branchedEntryId}/access-description?branch=draft`,
                ),
            ).expect(400);
        });
    });
});
