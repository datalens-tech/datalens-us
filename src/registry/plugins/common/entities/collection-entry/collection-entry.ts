import type {AppContext} from '@gravity-ui/nodekit';

import {CollectionEntryUnsupportedScopeError} from '../../../../../components/errors';
import type {Entry as EntryModel} from '../../../../../db/models/new/entry';
import {CollectionEntryPermissions} from '../../../../../entities/collection-entry';
import type {Permissions} from '../../../../../entities/shared-entry';
import type {Operation} from '../../../../../entities/types';

import {CollectionEntryConstructor, CollectionEntryInstance} from './types';

export const CollectionEntry: CollectionEntryConstructor<CollectionEntryInstance> = class CollectionEntry implements CollectionEntryInstance {
    static bulkFetchAllPermissions = async () => [];

    ctx: AppContext;
    model: EntryModel;
    permissions?: Permissions;

    constructor({ctx, model}: {ctx: AppContext; model: EntryModel}) {
        this.ctx = ctx;
        this.model = model;
        throw new CollectionEntryUnsupportedScopeError();
    }

    async register(): Promise<Operation> {
        throw new CollectionEntryUnsupportedScopeError();
    }

    async checkPermission(_args: {
        parentIds: string[];
        permission: CollectionEntryPermissions;
    }): Promise<void> {
        throw new CollectionEntryUnsupportedScopeError();
    }

    hasPermission(_permission: CollectionEntryPermissions): boolean {
        throw new CollectionEntryUnsupportedScopeError();
    }

    async fetchAllPermissions(_args: {parentIds: string[]}): Promise<void> {
        throw new CollectionEntryUnsupportedScopeError();
    }

    setPermissions(_permissions: Permissions) {
        throw new CollectionEntryUnsupportedScopeError();
    }

    async deletePermissions(): Promise<void> {
        throw new CollectionEntryUnsupportedScopeError();
    }

    enableAllPermissions() {
        throw new CollectionEntryUnsupportedScopeError();
    }
};
