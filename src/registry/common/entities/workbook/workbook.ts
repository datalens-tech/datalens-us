import type {AppContext} from '@gravity-ui/nodekit';
import type {WorkbookModel} from '../../../../db/models/new/workbook';
import {WorkbookConstructor, WorkbookInstance} from './types';
import {Permissions} from '../../../../entities/workbook/types';

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
