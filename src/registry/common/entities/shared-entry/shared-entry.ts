import type {AppContext} from '@gravity-ui/nodekit';
import {AppError} from '@gravity-ui/nodekit';

import {UserRole} from '../../../../components/auth/constants/role';
import {US_ERRORS} from '../../../../const';
import type {Entry as EntryModel} from '../../../../db/models/new/entry';
import {Permissions, SharedEntryPermission} from '../../../../entities/shared-entry/types';
import {getMockedOperation} from '../../../../entities/utils';
import Utils from '../../../../utils';

import {SharedEntryConstructor, SharedEntryInstance} from './types';

export const SharedEntry: SharedEntryConstructor<SharedEntryInstance> = class SharedEntry
    implements SharedEntryInstance
{
    ctx: AppContext;
    model: EntryModel;
    permissions?: Permissions;

    constructor({ctx, model}: {ctx: AppContext; model: EntryModel}) {
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

        return Promise.resolve(getMockedOperation(Utils.encodeId(this.model.entryId)));
    }

    async checkPermission(args: {
        parentIds: string[];
        permission: SharedEntryPermission;
    }): Promise<void> {
        const permissions = this.getAllPermissions();

        if (permissions[args.permission] === false) {
            throw new AppError(US_ERRORS.ACCESS_SERVICE_PERMISSION_DENIED, {
                code: US_ERRORS.ACCESS_SERVICE_PERMISSION_DENIED,
            });
        }

        return Promise.resolve();
    }

    async fetchAllPermissions(): Promise<void> {
        this.permissions = this.getAllPermissions();
        return Promise.resolve();
    }

    setPermissions(permissions: Permissions) {
        this.permissions = permissions;
    }

    async deletePermissions(): Promise<void> {
        this.permissions = undefined;
    }

    enableAllPermissions() {
        this.permissions = {
            listAccessBindings: true,
            updateAccessBindings: true,
            limitedView: true,
            view: true,
            update: true,
            copy: true,
            move: true,
            delete: true,
            createEntryBinding: true,
            createLimitedEntryBinding: true,
        };
    }

    private isEditorOrAdmin() {
        const {isAuthEnabled} = this.ctx.config;
        const user = this.ctx.get('user');
        return isAuthEnabled
            ? (user?.roles || []).some(
                  (role) => role === UserRole.Editor || role === UserRole.Admin,
              )
            : true;
    }

    private getAllPermissions() {
        const isEditorOrAdmin = this.isEditorOrAdmin();

        const permissions = {
            listAccessBindings: true,
            updateAccessBindings: isEditorOrAdmin,
            limitedView: true,
            view: true,
            update: isEditorOrAdmin,
            copy: isEditorOrAdmin,
            move: isEditorOrAdmin,
            delete: isEditorOrAdmin,
            createEntryBinding: isEditorOrAdmin,
            createLimitedEntryBinding: isEditorOrAdmin,
        };

        return permissions;
    }
};
