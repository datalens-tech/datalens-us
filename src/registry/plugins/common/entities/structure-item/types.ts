import type {AppContext} from '@gravity-ui/nodekit';

import type {CollectionModel} from '../../../../../db/models/new/collection';
import type {Entry as EntryModel} from '../../../../../db/models/new/entry';
import {WorkbookModel} from '../../../../../db/models/new/workbook';
import type {
    CollectionPermission,
    Permissions as CollectionPermissions,
} from '../../../../../entities/collection/types';
import type {CollectionEntryPermissions} from '../../../../../entities/collection-entry';
import {ALLOWED_COLLECTION_ENTRY_SCOPES} from '../../../../../entities/shared-entry';
import type {Operation} from '../../../../../entities/types';
import type {
    WorkbookPermission,
    Permissions as WorkbookPermissions,
} from '../../../../../entities/workbook';
import type {
    CollectionEntryFullPermissions,
    CollectionEntryInstance,
} from '../collection-entry/types';
import type {WorkbookInstance} from '../workbook/types';

export interface PermissionedEntityInstance<
    TPermission,
    TPermissions,
    TModel = CollectionModel | WorkbookModel | EntryModel,
> {
    ctx: AppContext;
    model: TModel;
    permissions?: TPermissions;

    register(args: {parentIds: string[]}): Promise<Operation>;

    checkPermission(args: {parentIds: string[]; permission: TPermission}): Promise<void>;

    fetchAllPermissions(args: {parentIds: string[]}): Promise<void>;

    setPermissions(permissions: TPermissions): void;

    deletePermissions(args: {parentIds: string[]; skipCheckPermissions?: boolean}): Promise<void>;

    enableAllPermissions(): void;
}

export interface StructureItemInstance extends PermissionedEntityInstance<
    CollectionPermission | WorkbookPermission | CollectionEntryPermissions,
    CollectionPermissions | WorkbookPermissions | CollectionEntryFullPermissions
> {}

const isEntryModel = (model: CollectionModel | WorkbookModel | EntryModel): model is EntryModel => {
    return 'entryId' in model && Boolean(model.entryId);
};

export const isCollectionEntryInstance = (
    structureItemInstance: StructureItemInstance,
): structureItemInstance is CollectionEntryInstance => {
    return (
        isEntryModel(structureItemInstance.model) &&
        ALLOWED_COLLECTION_ENTRY_SCOPES.includes(structureItemInstance.model.scope)
    );
};

export const isWorkbookInstance = (
    structureItemInstance: StructureItemInstance,
): structureItemInstance is WorkbookInstance => {
    return (
        !isEntryModel(structureItemInstance.model) &&
        'workbookId' in structureItemInstance.model &&
        Boolean(structureItemInstance.model.workbookId)
    );
};
