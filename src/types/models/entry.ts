export type EntryScope =
    | 'dataset'
    | 'pdf'
    | 'folder'
    | 'dash'
    | 'connection'
    | 'widget'
    | 'config'
    | 'report';

export type EntryInnerMeta = {
    oldKey: string;
    oldDisplayKey: string;
    lastDeletionUserId?: string;
};

/** @deprecated use EntryColumns */
export interface EntryType {
    entryId?: any;
    revId?: any;
    savedId?: any;
    publishedId?: any;
    key?: any;
    meta?: any;
    data?: any;
    unversionedData?: any;
    links?: any;
    tenantId?: any;
    displayKey?: any;
    scope?: any;
    type?: any;
    innerMeta?: any;
    createdBy?: any;
    createdAt?: any;
    updatedBy?: any;
    updatedAt?: any;
    isDeleted?: any;
    deletedAt?: any;
    public?: boolean;
    isLocked?: boolean;
    hidden?: any;
    // eslint-disable-next-line camelcase
    is_release?: any;
}

export type Mode = 'save' | 'publish';
