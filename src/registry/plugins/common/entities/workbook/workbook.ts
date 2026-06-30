import {AuthPolicy} from '@gravity-ui/expresskit';
import type {AppContext} from '@gravity-ui/nodekit';

import {UserRole} from '../../../../../components/auth/constants/role';
import {AccessServicePermissionDeniedError} from '../../../../../components/errors';
import type {WorkbookModel} from '../../../../../db/models/new/workbook';
import {getMockedOperation} from '../../../../../entities/utils';
import {Permissions, WorkbookPermission} from '../../../../../entities/workbook/types';
import Utils from '../../../../../utils';

import {WorkbookConstructor, WorkbookInstance} from './types';

export const Workbook: WorkbookConstructor<WorkbookInstance> = class Workbook implements WorkbookInstance {
    static bulkFetchAllPermissions = async (ctx, items) => {
        return Promise.all(
            items.map(async ({model}) => {
                const workbook = new Workbook({ctx, model});
                if (!ctx.config.accessServiceEnabled) {
                    workbook.enableAllPermissions();
                    return workbook;
                }
                await workbook.fetchAllPermissions({parentIds: []});
                return workbook;
            }),
        );
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
            throw new AccessServicePermissionDeniedError();
        }

        return Promise.resolve(getMockedOperation({id: Utils.encodeId(this.model.workbookId)}));
    }

    async checkPermission(args: {
        parentIds: string[];
        permission: WorkbookPermission;
    }): Promise<void> {
        const permissions = this.getAllPermissions();

        if (permissions[args.permission] === false) {
            throw new AccessServicePermissionDeniedError();
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
            securityApprove: true,
        };
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
            limitedView: true,
            view: true,
            update: isEditorOrAdmin,
            copy: isEditorOrAdmin,
            move: isEditorOrAdmin,
            publish: isEditorOrAdmin,
            embed: isEditorOrAdmin,
            delete: isEditorOrAdmin,
            securityApprove: isEditorOrAdmin,
        };

        return permissions;
    }
};
