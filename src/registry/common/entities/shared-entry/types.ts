import type {AppContext} from '@gravity-ui/nodekit';

import type {Entry as EntryModel} from '../../../../db/models/new/entry';
import type {Permissions, SharedEntryPermission} from '../../../../entities/shared-entry/types';
import type {Operation} from '../../../../entities/types';

export interface SharedEntryConstructor<T extends SharedEntryInstance = SharedEntryInstance> {
    new (args: {ctx: AppContext; model: EntryModel}): T;
}

export interface SharedEntryInstance {
    ctx: AppContext;
    model: EntryModel;
    permissions?: Permissions;

    register(args: {parentIds: string[]}): Promise<Operation>;

    checkPermission(args: {parentIds: string[]; permission: SharedEntryPermission}): Promise<void>;

    setPermissions(permissions: Permissions): void;

    deletePermissions(args: {parentIds: string[]; skipCheckPermissions?: boolean}): Promise<void>;

    enableAllPermissions(): void;

    fetchAllPermissions(args: {parentIds: string[]}): Promise<void>;
}
