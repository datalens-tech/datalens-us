import type {AppContext} from '@gravity-ui/nodekit';

import {SharedEntriesNotSupportedError} from '../../../../../components/errors';
import type {Entry as EntryModel} from '../../../../../db/models/new/entry';
import {Permissions, SharedEntryPermission} from '../../../../../entities/shared-entry/types';
import type {Operation} from '../../../../../entities/types';

import {SharedEntryConstructor, SharedEntryInstance} from './types';

export const SharedEntry: SharedEntryConstructor<SharedEntryInstance> = class SharedEntry implements SharedEntryInstance {
    static bulkFetchAllPermissions = async () => [];

    ctx: AppContext;
    model: EntryModel;
    permissions?: Permissions;

    constructor({ctx, model}: {ctx: AppContext; model: EntryModel}) {
        this.ctx = ctx;
        this.model = model;
        throw new SharedEntriesNotSupportedError();
    }

    async register(): Promise<Operation> {
        throw new SharedEntriesNotSupportedError();
    }

    async checkPermission(_args: {
        parentIds: string[];
        permission: SharedEntryPermission;
    }): Promise<void> {
        throw new SharedEntriesNotSupportedError();
    }

    async fetchAllPermissions(_args: {parentIds: string[]}): Promise<void> {
        throw new SharedEntriesNotSupportedError();
    }

    setPermissions(_permissions: Permissions) {
        throw new SharedEntriesNotSupportedError();
    }

    async deletePermissions(): Promise<void> {
        throw new SharedEntriesNotSupportedError();
    }

    enableAllPermissions() {
        throw new SharedEntriesNotSupportedError();
    }
};
