import type {AppContext} from '@gravity-ui/nodekit';
import type {WorkbookModel} from '../../../../db/models/new/workbook';
import {AppError} from '@gravity-ui/nodekit';
import {WorkbookConstructor, WorkbookInstance} from './types';
import {Permissions, WorkbookPermission} from '../../../../entities/workbook/types';
import {ZitadelUserRole} from '../../../../utils/zitadel';
import {US_ERRORS} from '../../../../const';

export const Workbook: WorkbookConstructor<WorkbookInstance> = class Workbook
    implements WorkbookInstance
{
    ctx: AppContext;
    model: WorkbookModel;
    permissions: Permissions;

    constructor({ctx, model}: {ctx: AppContext; model: WorkbookModel}) {
        this.ctx = ctx;
        this.model = model;

        const {zitadelUserRole: role} = this.ctx.config;

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
    }

    async register(_args: {parentIds: string[]}): Promise<unknown> {
        return Promise.resolve();
    }

    async checkPermission(args: {
        parentIds: string[];
        permission: WorkbookPermission;
    }): Promise<void> {
        if (this.permissions[args.permission] === false) {
            throw new AppError(US_ERRORS.ACCESS_SERVICE_PERMISSION_DENIED, {
                code: US_ERRORS.ACCESS_SERVICE_PERMISSION_DENIED,
            });
        }

        return Promise.resolve();
    }

    setPermissions() {}

    async fetchAllPermissions(_args: {parentIds: string[]}): Promise<void> {
        return Promise.resolve();
    }
};
