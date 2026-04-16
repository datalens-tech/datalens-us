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
    SecurityApprove = 'securityApprove',
}

export type Permissions = Record<WorkbookPermission, boolean>;
