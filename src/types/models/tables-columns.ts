import {EntryInnerMeta, EntryScope} from './entry';
import {SyncLinks} from './link';
import {TemplateData} from './template';
import {TenantMeta} from './tenant';

export interface TenantColumns {
    tenantId: string;
    meta: TenantMeta;
    enabled: boolean;
    deleting: boolean;
}

export interface WorkbookColumns {
    workbookId: string;
    title: string;
    description: string | null;
    tenantId: string;
    meta: Record<string, unknown>;
    createdBy: string;
    createdAt: string;
    titleUniq: string;
    deletedAt: string | null;
    deletedBy?: string | null;
}

export interface TemplateColumns {
    name: string;
    data: TemplateData;
}

export interface EntryColumns {
    scope: EntryScope;
    type: string;
    key: string;
    displayKey: string;
    innerMeta: EntryInnerMeta | null;
    createdBy: string;
    createdAt: string;
    updatedBy: string;
    updatedAt: string;
    isDeleted: boolean;
    deletedAt: string | null;
    hidden: boolean;
    mirrored: boolean;
    entryId: string;
    savedId: string;
    publishedId: string | null;
    tenantId: string;
    public: boolean;
    unversionedData: Record<string, unknown>;
    workbookId: string | null;
    // tsv: string;
    // sortName: string;
    // name: string; it is a service field, should be removed form the table
}

export interface RevisionColumns {
    revId: string;
    entryId: string;
    data: Record<string, unknown> | null;
    meta: Record<string, unknown> | null;
    links: SyncLinks | null;
    createdBy: string;
    createdAt: string;
    updatedBy: string;
    updatedAt: string;
}

export interface LockColumns {
    lockId: string;
    entryId: string;
    lockToken: string;
    expiryDate: string;
    startDate: string;
    login: string;
}

export interface LinksColumns {
    fromId: string;
    toId: string;
    name: string;
}

export interface FavoriteColumns {
    workbookId: string | null;
    scope: EntryScope;
    entryId: string;
    tenantId: string;
    login: string;
    alias: string | null;
    displayAlias: string | null;
    createdAt: string;
}
