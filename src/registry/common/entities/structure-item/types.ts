import type {AppContext} from '@gravity-ui/nodekit';

import type {CollectionModel} from '../../../../db/models/new/collection';
import type {Entry as EntryModel} from '../../../../db/models/new/entry';
import {WorkbookModel} from '../../../../db/models/new/workbook';
import type {
    CollectionPermission,
    Permissions as CollectionPermissions,
} from '../../../../entities/collection/types';
import type {
    SharedEntryPermission,
    Permissions as SharedEntryPermissions,
} from '../../../../entities/shared-entry/types';
import type {Operation} from '../../../../entities/types';
import type {
    WorkbookPermission,
    Permissions as WorkbookPermissions,
} from '../../../../entities/workbook';
import type {SharedEntryInstance} from '../shared-entry/types';
import type {WorkbookInstance} from '../workbook/types';

export interface StructureItemInstance {
    ctx: AppContext;
    model: CollectionModel | WorkbookModel | EntryModel;
    permissions?: CollectionPermissions | WorkbookPermissions | SharedEntryPermissions;

    register(args: {parentIds: string[]}): Promise<Operation>;

    checkPermission(args: {
        parentIds: string[];
        permission: CollectionPermission | WorkbookPermission | SharedEntryPermission;
    }): Promise<void>;

    setPermissions(
        permissions: CollectionPermissions | WorkbookPermissions | SharedEntryPermissions,
    ): void;

    deletePermissions(args: {parentIds: string[]; skipCheckPermissions?: boolean}): Promise<void>;

    enableAllPermissions(): void;

    fetchAllPermissions(args: {parentIds: string[]}): Promise<void>;
}

export const isSharedEntryInstance = (
    structureItemInstance: StructureItemInstance,
): structureItemInstance is SharedEntryInstance => {
    return 'entryId' in structureItemInstance.model && Boolean(structureItemInstance.model.entryId);
};

export const isWorkbookInstance = (
    structureItemInstance: StructureItemInstance,
): structureItemInstance is WorkbookInstance => {
    return (
        !isSharedEntryInstance(structureItemInstance) &&
        'workbookId' in structureItemInstance.model &&
        Boolean(structureItemInstance.model.workbookId)
    );
};
