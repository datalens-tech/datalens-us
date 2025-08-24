export enum SharedEntryRole {
    LimitedViewer = 'limitedViewer',
    Viewer = 'viewer',
    Editor = 'editor',
    Admin = 'admin',
    EntryBindingCreator = 'entryBindingCreator',
    LimitedEntryBindingCreator = 'limitedEntryBindingCreator',
}

export enum SharedEntryPermission {
    ListAccessBindings = 'listAccessBindings',
    UpdateAccessBindings = 'updateAccessBindings',
    LimitedView = 'limitedView',
    View = 'view',
    Update = 'update',
    Copy = 'copy',
    Move = 'move',
    Delete = 'delete',
    CreateEntryBinding = 'createEntryBinding',
    CreateLimitedEntryBinding = 'createLimitedEntryBinding',
}

export type Permissions = Record<SharedEntryPermission, boolean>;
