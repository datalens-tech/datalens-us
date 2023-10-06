export enum WorkbookRole {
    LimitedViewer = 'limitedViewer',
    Viewer = 'viewer',
    Editor = 'editor',
    Admin = 'admin',
}

export enum WorkbookPermission {
    ListAccessBindings = 'listAccessBindings',
    UpdateAccessBindings = 'updateAccessBindings',
    LimitedView = 'limitedView',
    View = 'view',
    Update = 'update',
    Copy = 'copy',
    Move = 'move',
    Publish = 'publish',
    Embed = 'embed',
    Delete = 'delete',
}

export type Permissions = Record<WorkbookPermission, boolean>;

export type WorkbookPermissions = {
    execute: boolean;
    read: boolean;
    edit: boolean;
    admin: boolean;
};
