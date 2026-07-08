import request from 'supertest';

import {ComputeEntriesFeatureDisabledError} from '../../../../../../components/errors';
import {routes} from '../../../../routes';
import {app, auth} from '../../auth';
import {createMockCollection} from '../../helpers';
import {OpensourceRole} from '../../roles';

let collectionId: string;

describe('Create compute entry', () => {
    beforeAll(async () => {
        const collection = await createMockCollection({
            title: 'Collection for compute entries',
            parentId: null,
        });
        collectionId = collection.collectionId;
    });

    test('scope=compute is rejected when the feature flag is disabled', async () => {
        const response = await auth(request(app).post(routes.entries), {
            role: OpensourceRole.Editor,
        })
            .send({
                name: 'Compute entry',
                scope: 'compute',
                collectionId,
            })
            .expect(400);

        expect(response.body.code).toBe(ComputeEntriesFeatureDisabledError.code);
    });
});
