import type {AppContext} from '@gravity-ui/nodekit';
import type {WorkbookModel} from '../../../../db/models/new/workbook';
import {AppError} from '@gravity-ui/nodekit';
import {WorkbookConstructor, WorkbookInstance} from './types';
import {Permissions, WorkbookPermission} from '../../../../entities/workbook/types';
import {US_ERRORS} from '../../../../const';
import {ZitadelUserRole} from '../../../../types/zitadel';

export const Workbook: WorkbookConstructor<WorkbookInstance> = class Workbook
    implements WorkbookInstance
{
    ctx: AppContext;
    model: WorkbookModel;
    permissions?: Permissions;

    constructor({ctx, model}: {ctx: AppContext; model: WorkbookModel}) {
        this.ctx = ctx;
        this.model = model;
    }

    async register(_args: {parentIds: string[]}): Promise<unknown> {
        return Promise.resolve();
    }

    async checkPermission(args: {
        parentIds: string[];
        permission: WorkbookPermission;
    }): Promise<void> {
        this.fetchAllPermissions();

        if (!this.permissions || this.permissions[args.permission] === false) {
            throw new AppError(US_ERRORS.ACCESS_SERVICE_PERMISSION_DENIED, {
                code: US_ERRORS.ACCESS_SERVICE_PERMISSION_DENIED,
            });
        }

        return Promise.resolve();
    }

    async fetchAllPermissions(): Promise<void> {
        const {zitadelUserRole: role} = this.ctx.get('info');

        const isEditorOrAdmin = role === ZitadelUserRole.Editor || role === ZitadelUserRole.Admin;

        this.permissions = {
            listAccessBindings: isEditorOrAdmin,
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

        return Promise.resolve();
    }

    setPermissions(permissions: Permissions) {
        this.permissions = permissions;
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
};
