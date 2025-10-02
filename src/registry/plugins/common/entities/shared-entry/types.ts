import type {AppContext} from '@gravity-ui/nodekit';

import type {Entry as EntryModel} from '../../../../../db/models/new/entry';
import type {Permissions, SharedEntryPermission} from '../../../../../entities/shared-entry/types';
import type {StructureItemInstance} from '../structure-item/types';

export interface SharedEntryConstructor<T extends SharedEntryInstance = SharedEntryInstance> {
    bulkFetchAllPermissions: BulkFetchSharedEntriesAllPermissions;
    new (args: {ctx: AppContext; model: EntryModel}): T;
}

export interface SharedEntryInstance extends StructureItemInstance {
    model: EntryModel;
    permissions?: Permissions;

    checkPermission(args: {parentIds: string[]; permission: SharedEntryPermission}): Promise<void>;

    setPermissions(permissions: Permissions): void;
}

export type BulkFetchSharedEntriesAllPermissions = (
    ctx: AppContext,
    items: {model: EntryModel; parentIds: string[]}[],
) => Promise<SharedEntryInstance[]>;
