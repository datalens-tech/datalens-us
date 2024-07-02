import type {AppContext} from '@gravity-ui/nodekit';
import type {WorkbookModel} from '../../../../db/models/new/workbook';
import type {WorkbookPermission, Permissions} from '../../../../entities/workbook/types';

export interface WorkbookConstructor<T = void> {
    new (args: {ctx: AppContext; model: WorkbookModel}): T extends void ? WorkbookInstance : T;
}

export interface WorkbookInstance {
    ctx: AppContext;
    model: WorkbookModel;
    permissions: Permissions;

    register(args: {parentIds: string[]}): Promise<unknown>;

    checkPermission(args: {parentIds: string[]; permission: WorkbookPermission}): Promise<void>;

    fetchAllPermissions(args: {parentIds: string[]}): Promise<void>;
}

export type BulkFetchWorkbooksAllPermissions = (
    ctx: AppContext,
    items: {model: WorkbookModel; parentIds: string[]}[],
) => Promise<WorkbookInstance[]>;
