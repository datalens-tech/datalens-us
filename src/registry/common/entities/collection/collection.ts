import type {AppContext} from '@gravity-ui/nodekit';
import type {CollectionModel} from '../../../../db/models/new/collection';
import {AppError} from '@gravity-ui/nodekit';
import {CollectionConstructor, CollectionInstance} from './types';
import {CollectionPermission, Permissions} from '../../../../entities/collection/types';
import {US_ERRORS} from '../../../../const';
import {ZitadelUserRole} from '../../../../types/zitadel';

export const Collection: CollectionConstructor = class Collection implements CollectionInstance {
    ctx: AppContext;
    model: CollectionModel;
    permissions?: Permissions;

    constructor({ctx, model}: {ctx: AppContext; model: CollectionModel}) {
        this.ctx = ctx;
        this.model = model;
    }

    private getAllPermissions() {
        const {zitadelUserRole: role} = this.ctx.get('info');

        const isEditorOrAdmin = role === ZitadelUserRole.Editor || role === ZitadelUserRole.Admin;

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

    async register() {}

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

    async fetchAllPermissions() {
        this.permissions = this.getAllPermissions();
        return Promise.resolve();
    }
};
