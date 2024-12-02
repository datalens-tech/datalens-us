import type {AppContext} from '@gravity-ui/nodekit';

import type {CollectionModel} from '../../../../db/models/new/collection';
import type {CollectionPermission, Permissions} from '../../../../entities/collection/types';
import {StructureItemInstance} from '../structure-item/types';

export interface CollectionConstructor<T extends CollectionInstance = CollectionInstance> {
    new (args: {ctx: AppContext; model: CollectionModel}): T;
}

export interface CollectionInstance extends StructureItemInstance {
    model: CollectionModel;
    permissions?: Permissions;

    checkPermission(args: {parentIds: string[]; permission: CollectionPermission}): Promise<void>;

    setPermissions(permissions: Permissions): void;
}

export type BulkFetchCollectionsAllPermissions = (
    ctx: AppContext,
    items: {model: CollectionModel; parentIds: string[]}[],
) => Promise<CollectionInstance[]>;
