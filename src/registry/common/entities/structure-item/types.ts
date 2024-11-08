import type {AppContext} from '@gravity-ui/nodekit';
import type {CollectionModel} from '../../../../db/models/new/collection';
import type {
    CollectionPermission,
    Permissions as CollectionPermissions,
} from '../../../../entities/collection/types';
import {WorkbookModel} from '../../../../db/models/new/workbook';
import {
    WorkbookPermission,
    Permissions as WorkbookPermissions,
} from '../../../../entities/workbook';
import {WorkbookInstance} from '../workbook/types';

export interface StructureItemInstance {
    ctx: AppContext;
    model: CollectionModel | WorkbookModel;
    permissions?: CollectionPermissions | WorkbookPermissions;

    register(args: {parentIds: string[]}): Promise<unknown>;

    checkPermission(args: {
        parentIds: string[];
        permission: CollectionPermission | WorkbookPermission;
    }): Promise<void>;

    setPermissions(permissions: CollectionPermissions | WorkbookPermissions): void;

    deletePermissions(args: {parentIds: string[]; skipCheckPermissions?: boolean}): Promise<void>;

    enableAllPermissions(): void;

    fetchAllPermissions(args: {parentIds: string[]}): Promise<void>;
}

export const isWorkbookInstance = (
    structureItemInstance: StructureItemInstance,
): structureItemInstance is WorkbookInstance => {
    return (
        'workbookId' in structureItemInstance.model &&
        Boolean(structureItemInstance.model.workbookId)
    );
};
