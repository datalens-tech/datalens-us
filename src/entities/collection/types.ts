export enum CollectionRole {
    LimitedViewer = 'limitedViewer',
    Viewer = 'viewer',
    Editor = 'editor',
    Admin = 'admin',
    Visitor = 'visitor',
    Creator = 'creator',
    // TODO: add roles
    // EntryBindingCreator = 'entryBindingCreator',
    // LimitedEntryBindingCreator = 'limitedEntryBindingCreator',
}

export enum CollectionPermission {
    ListAccessBindings = 'listAccessBindings',
    UpdateAccessBindings = 'updateAccessBindings',
    CreateCollection = 'createCollection',
    CreateWorkbook = 'createWorkbook',
    CreateSharedEntry = 'createSharedEntry',
    LimitedView = 'limitedView',
    View = 'view',
    Update = 'update',
    Copy = 'copy',
    Move = 'move',
    Delete = 'delete',
    SecurityManage = 'securityManage',
    SecurityApprove = 'securityApprove',
    Browse = 'browse',
}

export type Permissions = Record<CollectionPermission, boolean>;
