import type {Permissions as SharedEntryPermissions} from '../../../../entities/shared-entry/types';
import type {EntryScope} from '../../../../types/models';

export interface EntryPermissions {
    execute?: boolean;
    read?: boolean;
    edit?: boolean;
    admin?: boolean;
}

export type EntryWithPermissions<T> = T & {
    isLocked?: boolean;
    permissions?: EntryPermissions;
    accessBindings?: SharedEntryPermissions;
};

export type PartialEntry = {
    entryId: string;
    scope: EntryScope;
    workbookId: string | null;
    collectionId: string | null;
};
