import type {AppContext} from '@gravity-ui/nodekit';

import type {Entry as EntryModel} from '../../../../../db/models/new/entry';
import type {CollectionEntryPermissions} from '../../../../../entities/collection-entry';
import type {ComputeEntryPermissions} from '../../../../../entities/compute-entry';
import type {Permissions as SharedEntryPermissions} from '../../../../../entities/shared-entry';
import type {PermissionedEntityInstance} from '../structure-item/types';

export type CollectionEntryFullPermissions = SharedEntryPermissions | ComputeEntryPermissions;

export interface CollectionEntryConstructor<
    T extends CollectionEntryInstance = CollectionEntryInstance,
> {
    bulkFetchAllPermissions: BulkFetchCollectionEntriesAllPermissions;
    new (args: {ctx: AppContext; model: EntryModel}): T;
}

export interface CollectionEntryInstance extends PermissionedEntityInstance<
    CollectionEntryPermissions,
    CollectionEntryFullPermissions,
    EntryModel
> {
    hasPermission(permission: CollectionEntryPermissions): boolean;
}

export type BulkFetchCollectionEntriesAllPermissions = (
    ctx: AppContext,
    items: {model: EntryModel; parentIds: string[]}[],
) => Promise<CollectionEntryInstance[]>;
