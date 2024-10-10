/* eslint-disable camelcase */
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
    scope: string;
    permissionsMode?: DlsPermissionsMode;
    initialPermissions?: any;
    initialParentId?: string;
    parentFolderKey?: string;
    parentFolderId?: string;
}
export interface CheckPermissionDlsConfig {
    entryId: string;
    action: string;
    includePermissionsInfo?: boolean;
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

export type DlsPermissionDiff = {
    [permission in `${DlsPermissions}`]?: DlsPermissionSubject[];
};

export type DlsModifyPermissionDiff = {
    [permission in `${DlsPermissions}`]?: DlsModifyPermissionSubject[];
};

export interface DlsModifyBody {
    diff: {
        added?: DlsPermissionDiff;
        removed?: DlsPermissionDiff;
        modified?: DlsModifyPermissionDiff;
    };
}
export interface ModifyPermissionDlsConfig {
    entryId: string;
    body: DlsModifyBody;
}
export interface DlsEntity {
    entryId?: string;
    isLocked?: boolean;
    permissions?: UsPermission;
}
export interface CheckBulkPermissionsDlsConfig {
    entities?: DlsEntity[];
    action: string;
    includePermissionsInfo?: boolean;
}
