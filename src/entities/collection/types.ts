export enum CollectionRole {
    LimitedViewer = 'limitedViewer',
    Viewer = 'viewer',
    Editor = 'editor',
    Admin = 'admin',
}

export enum CollectionPermission {
    ListAccessBindings = 'listAccessBindings',
    UpdateAccessBindings = 'updateAccessBindings',
    CreateCollection = 'createCollection',
    CreateWorkbook = 'createWorkbook',
    LimitedView = 'limitedView',
    View = 'view',
    Update = 'update',
    Copy = 'copy',
    Move = 'move',
    Delete = 'delete',
}

export type Permissions = Record<CollectionPermission, boolean>;
