import {
    ComputeEntryPermission,
    ComputeEntryPermissions,
} from '../../../entities/compute-entry/types';
import {Permissions, SharedEntryPermission} from '../../../entities/shared-entry/types';
import {
    mapComputeEntryPermissions,
    mapSharedEntryPermissions,
} from '../../../services/new/entry/collection-entry/permission-mappers';

const sharedPermissions = (overrides: Partial<Permissions> = {}): Permissions => ({
    ...(Object.fromEntries(
        Object.values(SharedEntryPermission).map((p) => [p, false]),
    ) as Permissions),
    ...overrides,
});

const computePermissions = (
    overrides: Partial<ComputeEntryPermissions> = {},
): ComputeEntryPermissions => ({
    ...(Object.fromEntries(
        Object.values(ComputeEntryPermission).map((p) => [p, false]),
    ) as ComputeEntryPermissions),
    ...overrides,
});

describe('collection-entry permission mappers', () => {
    test('shared permissions project onto the 4-flag set (limitedView/view/update/updateAccessBindings)', () => {
        const result = mapSharedEntryPermissions(
            sharedPermissions({
                limitedView: true,
                view: true,
                update: false,
                updateAccessBindings: true,
            }),
        );

        expect(result).toEqual({execute: true, read: true, edit: false, admin: true});
    });

    test('compute permissions project onto the 4-flag set (get drives execute+read, update->edit, updateAccessBindings->admin)', () => {
        const result = mapComputeEntryPermissions(
            computePermissions({
                get: true,
                update: false,
                updateAccessBindings: true,
            }),
        );

        expect(result).toEqual({execute: true, read: true, edit: false, admin: true});
    });

    test('compute `use` is data-plane and does not grant any US permission', () => {
        const result = mapComputeEntryPermissions(computePermissions({use: true}));

        expect(result).toEqual({execute: false, read: false, edit: false, admin: false});
    });

    test('mappers return undefined when permissions are not resolved', () => {
        expect(mapSharedEntryPermissions(undefined)).toBeUndefined();
        expect(mapComputeEntryPermissions(undefined)).toBeUndefined();
    });

    test('vocabularies are not conflated: shared Read comes from `view`, compute Read from `get`', () => {
        expect(mapSharedEntryPermissions(sharedPermissions({view: true}))?.read).toBe(true);

        expect(mapComputeEntryPermissions(computePermissions({get: true}))?.read).toBe(true);
        expect(mapComputeEntryPermissions(computePermissions({get: false}))?.read).toBe(false);
    });
});
