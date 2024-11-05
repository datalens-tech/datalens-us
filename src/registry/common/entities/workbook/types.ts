import type {AppContext} from '@gravity-ui/nodekit';
import type {WorkbookModel} from '../../../../db/models/new/workbook';
import type {WorkbookPermission, Permissions} from '../../../../entities/workbook/types';
import {StructureItemInstance} from '../structure-item/types';
import {ServiceArgs} from '../../../../services/new/types';

export interface WorkbookConstructor<T = void> {
    new (args: {ctx: AppContext; model: WorkbookModel}): T extends void ? WorkbookInstance : T;
}

export interface WorkbookInstance extends StructureItemInstance {
    model: WorkbookModel;
    permissions?: Permissions;

    checkPermission(args: {parentIds: string[]; permission: WorkbookPermission}): Promise<void>;

    deletePermissions(args: {parentIds: string[]; skipCheckPermission?: boolean}): Promise<void>;

    setPermissions(permissions: Permissions): void;
}

export type BulkFetchWorkbooksAllPermissions = (
    ctx: AppContext,
    items: {model: WorkbookModel; parentIds: string[]}[],
) => Promise<WorkbookInstance[]>;

export type DeleteWorkbooksList = (
    {ctx, trx}: ServiceArgs,
    {workbooksMap}: {workbooksMap: Map<WorkbookModel, string[]>},
) => Promise<WorkbookModel[]>;
