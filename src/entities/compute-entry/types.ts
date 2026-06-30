export enum ComputeEntryRole {
    Viewer = 'viewer',
    Editor = 'editor',
    Admin = 'admin',
}

export enum ComputeEntryPermission {
    ListAccessBindings = 'listAccessBindings',
    UpdateAccessBindings = 'updateAccessBindings',
    Get = 'get',
    Use = 'use',
    Update = 'update',
    Delete = 'delete',
}

export type ComputeEntryPermissions = Record<ComputeEntryPermission, boolean>;
