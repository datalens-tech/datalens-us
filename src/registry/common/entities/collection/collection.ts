import type {AppContext} from '@gravity-ui/nodekit';
import {AppError} from '@gravity-ui/nodekit';

import {US_ERRORS} from '../../../../const';
import type {CollectionModel} from '../../../../db/models/new/collection';
import {CollectionPermission, Permissions} from '../../../../entities/collection/types';
import {getMockedOperation} from '../../../../entities/utils';
import {ZitadelUserRole} from '../../../../types/zitadel';
import Utils from '../../../../utils';

import {CollectionConstructor, CollectionInstance} from './types';

export const Collection: CollectionConstructor = class Collection implements CollectionInstance {
    ctx: AppContext;
    model: CollectionModel;
    permissions?: Permissions;

    constructor({ctx, model}: {ctx: AppContext; model: CollectionModel}) {
        this.ctx = ctx;
        this.model = model;
    }

    async register() {
        const isEditorOrAdmin = this.isEditorOrAdmin();

        if (!isEditorOrAdmin) {
            throw new AppError(US_ERRORS.ACCESS_SERVICE_PERMISSION_DENIED, {
                code: US_ERRORS.ACCESS_SERVICE_PERMISSION_DENIED,
            });
        }

        return Promise.resolve(getMockedOperation(Utils.encodeId(this.model.collectionId)));
    }

    async checkPermission(args: {
        parentIds: string[];
        permission: CollectionPermission;
    }): Promise<void> {
        const permissions = this.getAllPermissions();

        if (permissions[args.permission] === false) {
            throw new AppError(US_ERRORS.ACCESS_SERVICE_PERMISSION_DENIED, {
                code: US_ERRORS.ACCESS_SERVICE_PERMISSION_DENIED,
            });
        }

        return Promise.resolve();
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

    setPermissions(permissions: Permissions) {
        this.permissions = permissions;
    }

    async deletePermissions(): Promise<void> {
        this.permissions = undefined;
    }

    async fetchAllPermissions() {
        this.permissions = this.getAllPermissions();
        return Promise.resolve();
    }

    private isEditorOrAdmin() {
        const {zitadelUserRole: role} = this.ctx.get('info');
        return role === ZitadelUserRole.Editor || role === ZitadelUserRole.Admin;
    }

    private getAllPermissions() {
        const isEditorOrAdmin = this.isEditorOrAdmin();

        const permissions = {
            listAccessBindings: true,
            updateAccessBindings: isEditorOrAdmin,
            createCollection: isEditorOrAdmin,
            createWorkbook: isEditorOrAdmin,
            limitedView: true,
            view: true,
            update: isEditorOrAdmin,
            copy: isEditorOrAdmin,
            move: isEditorOrAdmin,
            delete: isEditorOrAdmin,
        };

        return permissions;
    }
};
