/* eslint-disable camelcase */
import {EntryScope} from './entry';
import {UsPermission} from './permission';

export enum DlsActions {
    Execute = 'execute',
    Read = 'read',
    Edit = 'edit',
    SetPermissions = 'set_permissions',
}
export enum DlsPermissions {
    Execute = 'acl_execute',
    Read = 'acl_view',
    Write = 'acl_edit',
    Admin = 'acl_adm',
}
export interface DlsPermission {
    execute?: boolean;
    read?: boolean;
    edit?: boolean;
    set_permissions?: boolean;
}
export type DlsPermissionsMode = 'explicit' | 'parent_and_owner' | 'owner_only';
export interface CreationDlsEntityConfig {
    entryId: string;
    scope: EntryScope;
    permissionsMode?: DlsPermissionsMode;
    initialPermissions?: any;
    initialParentId?: string;
    parentFolderKey?: string;
    parentFolder?: any;
}
export interface CheckPermissionDlsConfig {
    entryId: string;
    action: string;
    bypassEmitErrorEnabled?: boolean;
    includePermissionsInfo?: boolean;
}
export interface GetPermissionDlsConfig {
    entryId: string;
}

export interface DlsPermissionSubject {
    subject: string;
    comment?: string;
}

interface DlsModifyPermissionSubject extends DlsPermissionSubject {
    new: {
        subject: string;
        grantType: string;
    };
}
interface DlsModifyBody {
    diff: {
        added?: {
            [DlsPermissions.Read]?: DlsPermissionSubject[];
            [DlsPermissions.Write]?: DlsPermissionSubject[];
            [DlsPermissions.Admin]?: DlsPermissionSubject[];
            [DlsPermissions.Execute]?: DlsPermissionSubject[];
        };
        removed?: {
            [DlsPermissions.Read]?: DlsPermissionSubject[];
            [DlsPermissions.Write]?: DlsPermissionSubject[];
            [DlsPermissions.Admin]?: DlsPermissionSubject[];
            [DlsPermissions.Execute]?: DlsPermissionSubject[];
        };
        modified?: {
            [DlsPermissions.Read]?: DlsModifyPermissionSubject[];
            [DlsPermissions.Write]?: DlsModifyPermissionSubject[];
            [DlsPermissions.Admin]?: DlsModifyPermissionSubject[];
            [DlsPermissions.Execute]?: DlsModifyPermissionSubject[];
        };
    };
}
export interface ModifyPermissionDlsConfig {
    entryId?: any;
    body: DlsModifyBody;
}
export interface BatchPermissionDlsConfig {
    body: {
        nodes: {
            node: string;
            body: DlsModifyBody;
        }[];
    };
}
export interface GetSuggestDlsConfig {
    searchText?: string;
    limit?: string;
    lang?: string;
}
export interface DlsEntity {
    entryId?: string;
    isLocked?: boolean;
    permissions?: UsPermission;
}
export interface CheckBulkPermissionsDlsConfig {
    entities?: DlsEntity[];
    action: DlsActions;
    includePermissionsInfo?: boolean;
}
