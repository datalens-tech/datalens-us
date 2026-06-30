import {AuthPolicy} from '@gravity-ui/expresskit';
import type {AppContext} from '@gravity-ui/nodekit';

import {UserRole} from '../../../../../components/auth/constants/role';
import {AccessServicePermissionDeniedError} from '../../../../../components/errors';
import type {CollectionModel} from '../../../../../db/models/new/collection';
import {CollectionPermission, Permissions} from '../../../../../entities/collection/types';
import {getMockedOperation} from '../../../../../entities/utils';
import Utils from '../../../../../utils';

import {CollectionConstructor, CollectionInstance} from './types';

export const Collection: CollectionConstructor<CollectionInstance> = class Collection implements CollectionInstance {
    static bulkFetchAllPermissions = async (ctx, items) => {
        return Promise.all(
            items.map(async ({model}) => {
                const collection = new Collection({ctx, model});
                if (!ctx.config.accessServiceEnabled) {
                    collection.enableAllPermissions();
                    return collection;
                }
                await collection.fetchAllPermissions({parentIds: []});
                return collection;
            }),
        );
    };

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
            throw new AccessServicePermissionDeniedError();
        }

        return Promise.resolve(getMockedOperation({id: Utils.encodeId(this.model.collectionId)}));
    }

    async checkPermission(args: {
        parentIds: string[];
        permission: CollectionPermission;
    }): Promise<void> {
        const permissions = this.getAllPermissions();

        if (permissions[args.permission] === false) {
            throw new AccessServicePermissionDeniedError();
        }

        return Promise.resolve();
    }

    enableAllPermissions() {
        this.permissions = {
            listAccessBindings: true,
            updateAccessBindings: true,
            createCollection: true,
            createWorkbook: true,
            createSharedEntry: true,
            createSparkCluster: true,
            createTrinoCluster: true,
            limitedView: true,
            view: true,
            update: true,
            copy: true,
            move: true,
            delete: true,
            securityManage: true,
            securityApprove: true,
            browse: true,
        };
    }

    setPermissions(permissions: Permissions) {
        this.permissions = permissions;
    }

    async deletePermissions(): Promise<void> {
        this.permissions = undefined;
    }

    async fetchAllPermissions(_args: {parentIds: string[]}) {
        this.permissions = this.getAllPermissions();
        return Promise.resolve();
    }

    private isEditorOrAdmin() {
        const {appAuthPolicy} = this.ctx.config;
        const user = this.ctx.get('user');

        if (appAuthPolicy === AuthPolicy.disabled) {
            return true;
        }

        return (user?.roles || []).some(
            (role) => role === UserRole.Editor || role === UserRole.Admin,
        );
    }

    private getAllPermissions() {
        const isEditorOrAdmin = this.isEditorOrAdmin();

        const permissions = {
            listAccessBindings: true,
            updateAccessBindings: isEditorOrAdmin,
            createCollection: isEditorOrAdmin,
            createWorkbook: isEditorOrAdmin,
            createSharedEntry: isEditorOrAdmin,
            createSparkCluster: isEditorOrAdmin,
            createTrinoCluster: isEditorOrAdmin,
            limitedView: true,
            view: true,
            browse: true,
            update: isEditorOrAdmin,
            copy: isEditorOrAdmin,
            move: isEditorOrAdmin,
            delete: isEditorOrAdmin,
            securityManage: isEditorOrAdmin,
            securityApprove: isEditorOrAdmin,
        };

        return permissions;
    }
};
