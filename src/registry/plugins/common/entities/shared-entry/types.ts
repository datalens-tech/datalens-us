import type {AppContext} from '@gravity-ui/nodekit';

import type {Entry as EntryModel} from '../../../../../db/models/new/entry';
import type {Permissions, SharedEntryPermission} from '../../../../../entities/shared-entry/types';
import type {PermissionedEntityInstance} from '../structure-item/types';

export interface SharedEntryConstructor<T extends SharedEntryInstance = SharedEntryInstance> {
    bulkFetchAllPermissions: BulkFetchSharedEntriesAllPermissions<T>;
    new (args: {ctx: AppContext; model: EntryModel}): T;
}

export interface SharedEntryInstance extends PermissionedEntityInstance<
    SharedEntryPermission,
    Permissions,
    EntryModel
> {}

export type BulkFetchSharedEntriesAllPermissions<
    T extends SharedEntryInstance = SharedEntryInstance,
> = (ctx: AppContext, items: {model: EntryModel; parentIds: string[]}[]) => Promise<T[]>;
