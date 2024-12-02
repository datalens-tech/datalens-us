import type {AppContext} from '@gravity-ui/nodekit';

import type {WorkbookModel} from '../../../../db/models/new/workbook';
import type {Permissions, WorkbookPermission} from '../../../../entities/workbook/types';
import {StructureItemInstance} from '../structure-item/types';

export interface WorkbookConstructor<T = void> {
    new (args: {ctx: AppContext; model: WorkbookModel}): T extends void ? WorkbookInstance : T;
}

export interface WorkbookInstance extends StructureItemInstance {
    model: WorkbookModel;
    permissions?: Permissions;

    checkPermission(args: {parentIds: string[]; permission: WorkbookPermission}): Promise<void>;

    setPermissions(permissions: Permissions): void;
}

export type BulkFetchWorkbooksAllPermissions = (
    ctx: AppContext,
    items: {model: WorkbookModel; parentIds: string[]}[],
) => Promise<WorkbookInstance[]>;
