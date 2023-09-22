import type {AppContext} from '@gravity-ui/nodekit';
import type {CollectionModel} from '../../../../db/models/new/collection';
import {CollectionConstructor, CollectionInstance} from './types';
import {Permissions} from '../../../../entities/collection/types';

export const Collection: CollectionConstructor = class Collection implements CollectionInstance {
    ctx: AppContext;
    model: CollectionModel;
    permissions?: Permissions;

    constructor({ctx, model}: {ctx: AppContext; model: CollectionModel}) {
        this.ctx = ctx;
        this.model = model;
    }

    async register() {}

    async checkPermission() {}

    async fetchAllPermissions() {}

    setPermissions(permissions: Permissions) {
        this.permissions = permissions;
    }

    enableAllPermissions() {
        this.permissions = {
            listAccessBindings: true,
            updateAccessBindings: true,
            createCollection: true,
            createWorkbook: true,
            limitedView: true,
            view: true,
            update: true,
            copy: true,
            move: true,
            delete: true,
        };
    }
};
