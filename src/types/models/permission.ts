import {EntryScope} from './entry';

export enum UsPermissions {
    Execute = 'execute',
    Read = 'read',
    Edit = 'edit',
    Admin = 'admin',
}

export interface UsPermission {
    execute?: boolean;
    read?: boolean;
    edit?: boolean;
    admin?: boolean;
}

export interface PrivatePermissions {
    ownedScopes: EntryScope[];
}
