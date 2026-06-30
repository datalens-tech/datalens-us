import type {AppContext} from '@gravity-ui/nodekit';

import type {Entry as EntryModel} from '../../../db/models/new/entry';
import {EntryScope} from '../../../db/models/new/entry/types';
import {
    ComputeEntryPermission,
    ComputeEntryPermissions,
} from '../../../entities/compute-entry/types';
import {Permissions, SharedEntryPermission} from '../../../entities/shared-entry/types';
import type {CollectionEntryInstance} from '../../../registry/plugins/common/entities/collection-entry/types';
import {
    bulkFetchCollectionEntryPermissions,
    createCollectionEntry,
    getCollectionEntryPermissions,
} from '../../../services/new/entry/collection-entry/utils';

const fullShared = (overrides: Partial<Permissions> = {}): Permissions => ({
    ...(Object.fromEntries(
        Object.values(SharedEntryPermission).map((p) => [p, false]),
    ) as Permissions),
    ...overrides,
});

const fullCompute = (
    overrides: Partial<ComputeEntryPermissions> = {},
): ComputeEntryPermissions => ({
    ...(Object.fromEntries(
        Object.values(ComputeEntryPermission).map((p) => [p, false]),
    ) as ComputeEntryPermissions),
    ...overrides,
});

const makeSharedInstance = (permissions?: Permissions) =>
    ({
        model: {entryId: 's1', scope: EntryScope.Dataset},
        permissions,
    }) as unknown as CollectionEntryInstance;

const makeComputeInstance = (permissions?: ComputeEntryPermissions) =>
    ({
        model: {entryId: 'c1', scope: EntryScope.Compute},
        permissions,
    }) as unknown as CollectionEntryInstance;

describe('createCollectionEntry (single class, no scope dispatch)', () => {
    const makeCtx = () => {
        const CollectionEntry = jest.fn();
        const ctx = {
            get: (key: string) =>
                key === 'registry'
                    ? {common: {classes: {get: () => ({CollectionEntry})}}}
                    : undefined,
        } as unknown as AppContext;
        return {ctx, CollectionEntry};
    };

    test.each([
        [
            'compute',
            {entryId: 'c1', scope: EntryScope.Compute, workbookId: null, collectionId: 'col1'},
        ],
        [
            'dataset',
            {entryId: 's1', scope: EntryScope.Dataset, workbookId: null, collectionId: 'col1'},
        ],
        [
            'connection',
            {entryId: 's2', scope: EntryScope.Connection, workbookId: null, collectionId: 'col1'},
        ],
    ])('instantiates a single CollectionEntry for a %s entry', (_label, entry) => {
        const {ctx, CollectionEntry} = makeCtx();

        createCollectionEntry(ctx, entry as unknown as EntryModel);

        expect(CollectionEntry).toHaveBeenCalledTimes(1);
        expect(CollectionEntry).toHaveBeenCalledWith({ctx, model: entry});
    });
});

describe('getCollectionEntryPermissions (scope-aware projection)', () => {
    test('uses the shared projection for a shared instance', () => {
        const instance = makeSharedInstance(fullShared({view: true, update: true}));
        expect(getCollectionEntryPermissions(instance)).toEqual({
            execute: false,
            read: true,
            edit: true,
            admin: false,
        });
    });

    test('uses the compute projection for a compute instance (get drives execute and read)', () => {
        const instance = makeComputeInstance(fullCompute({get: true, update: true}));
        expect(getCollectionEntryPermissions(instance)).toEqual({
            execute: true,
            read: true,
            edit: true,
            admin: false,
        });
    });

    test('returns undefined when permissions are not resolved', () => {
        expect(getCollectionEntryPermissions(makeSharedInstance(undefined))).toBeUndefined();
        expect(getCollectionEntryPermissions(makeComputeInstance(undefined))).toBeUndefined();
    });
});

describe('bulkFetchCollectionEntryPermissions (single fetch, mapped by entryId)', () => {
    const makeRegistryCtx = (bulkFetchAllPermissions: jest.Mock) =>
        ({
            get: (key: string) =>
                key === 'registry'
                    ? {
                          common: {
                              classes: {get: () => ({CollectionEntry: {bulkFetchAllPermissions}})},
                          },
                      }
                    : undefined,
        }) as unknown as AppContext;

    test('passes all items to CollectionEntry.bulkFetchAllPermissions and indexes by entryId', async () => {
        const sharedItem = {model: {entryId: 's1', scope: EntryScope.Dataset}, parentIds: ['p']};
        const computeItem = {model: {entryId: 'c1', scope: EntryScope.Compute}, parentIds: ['p']};

        const instances = [{model: {entryId: 's1'}}, {model: {entryId: 'c1'}}];
        const bulkFetchAllPermissions = jest.fn().mockResolvedValue(instances);
        const ctx = makeRegistryCtx(bulkFetchAllPermissions);

        const result = await bulkFetchCollectionEntryPermissions({ctx}, [
            sharedItem,
            computeItem,
        ] as never);

        expect(bulkFetchAllPermissions).toHaveBeenCalledWith(ctx, [sharedItem, computeItem]);
        expect(result.get('s1')).toBe(instances[0]);
        expect(result.get('c1')).toBe(instances[1]);
        expect(result.size).toBe(2);
    });
});
