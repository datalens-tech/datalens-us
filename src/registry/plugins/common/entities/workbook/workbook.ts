import type {AppContext} from '@gravity-ui/nodekit';
import {AppError} from '@gravity-ui/nodekit';

import {UserRole} from '../../../../../components/auth/constants/role';
import {US_ERRORS} from '../../../../../const';
import type {WorkbookModel} from '../../../../../db/models/new/workbook';
import {getMockedOperation} from '../../../../../entities/utils';
import {Permissions, WorkbookPermission} from '../../../../../entities/workbook/types';
import {ZitadelUserRole} from '../../../../../types/zitadel';
import Utils from '../../../../../utils';

import {WorkbookConstructor, WorkbookInstance} from './types';

export const Workbook: WorkbookConstructor<WorkbookInstance> = class Workbook
    implements WorkbookInstance
{
    static bulkFetchAllPermissions = async (ctx, items) => {
        return items.map(({model}) => {
            const workbook = new Workbook({ctx, model});
            if (ctx.config.accessServiceEnabled) {
                workbook.fetchAllPermissions({parentIds: []});
            } else {
                workbook.enableAllPermissions();
            }
            return workbook;
        });
    };

    ctx: AppContext;
    model: WorkbookModel;
    permissions?: Permissions;

    constructor({ctx, model}: {ctx: AppContext; model: WorkbookModel}) {
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

        return Promise.resolve(getMockedOperation(Utils.encodeId(this.model.workbookId)));
    }

    async checkPermission(args: {
        parentIds: string[];
        permission: WorkbookPermission;
    }): Promise<void> {
        const permissions = this.getAllPermissions();

        if (permissions[args.permission] === false) {
            throw new AppError(US_ERRORS.ACCESS_SERVICE_PERMISSION_DENIED, {
                code: US_ERRORS.ACCESS_SERVICE_PERMISSION_DENIED,
            });
        }

        return Promise.resolve();
    }

    async fetchAllPermissions(_args: {parentIds: string[]}): Promise<void> {
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
            publish: true,
            embed: true,
            delete: true,
        };
    }

    private isEditorOrAdmin() {
        const {isAuthEnabled} = this.ctx.config;
        const user = this.ctx.get('user');
        const {zitadelUserRole} = this.ctx.get('info');
        return isAuthEnabled
            ? (user?.roles || []).some(
                  (role) => role === UserRole.Editor || role === UserRole.Admin,
              )
            : zitadelUserRole === ZitadelUserRole.Editor ||
                  zitadelUserRole === ZitadelUserRole.Admin;
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
            publish: isEditorOrAdmin,
            embed: isEditorOrAdmin,
            delete: isEditorOrAdmin,
        };

        return permissions;
    }
};
