import type {ComputeEntryPermissions} from '../../../../entities/compute-entry/types';
import type {Permissions as SharedEntryPermissions} from '../../../../entities/shared-entry/types';
import type {EntryScope} from '../../../../types/models';

export interface EntryPermissions {
    execute?: boolean;
    read?: boolean;
    edit?: boolean;
    admin?: boolean;
}

export type EntryFullPermissions = SharedEntryPermissions | ComputeEntryPermissions;

export type EntryWithPermissions<T, P = SharedEntryPermissions> = T & {
    isLocked?: boolean;
    permissions?: EntryPermissions;
    fullPermissions?: P;
    isRestricted?: boolean;
};

export type PartialEntry = {
    entryId: string;
    scope: EntryScope;
    workbookId: string | null;
    collectionId: string | null;
};
