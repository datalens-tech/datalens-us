import type {AppContext} from '@gravity-ui/nodekit';
import type {CollectionModel} from '../../../../db/models/new/collection';
import type {CollectionPermission, Permissions} from '../../../../entities/collection/types';

export interface CollectionConstructor<T extends CollectionInstance = CollectionInstance> {
    new (args: {ctx: AppContext; model: CollectionModel}): T;
}

export interface CollectionInstance {
    ctx: AppContext;
    model: CollectionModel;
    permissions?: Permissions;

    register(args: {parentIds: string[]}): Promise<unknown>;

    checkPermission(args: {parentIds: string[]; permission: CollectionPermission}): Promise<void>;

    setPermissions(permissions: Permissions): void;

    enableAllPermissions(): void;

    fetchAllPermissions(args: {parentIds: string[]}): Promise<void>;
}

export type BulkFetchCollectionsAllPermissions = (
    ctx: AppContext,
    items: {model: CollectionModel; parentIds: string[]}[],
) => Promise<CollectionInstance[]>;
