import {TransactionOrKnex} from 'objection';

import {EntryPermissions} from '../../services/new/entry/types';

import {BasicRequestParams, RequestedBy} from './common';
import {CTX} from './core';
import {DlsPermission} from './dls';
import {EntryType, Mode} from './entry';
import {SyncLinks} from './link';
import {UsPermissions} from './permission';

export interface OriginatePermissionsConf {
    isPrivateRoute?: boolean;
    shared?: boolean;
    permissions?: {
        extra: DlsPermission;
    };
    iamPermissions?: EntryPermissions;
    ctx: CTX;
}
export interface PrivateGetAllEntriesByKeyConfig {
    key: string;
    branch?: string;
    isDeleted?: boolean;
    requestedBy: RequestedBy;
}
export interface SyncLinksConf {
    trxOverride: TransactionOrKnex;
    entryId: string;
    links: SyncLinks | null | undefined;
    ctx: CTX;
}
export interface CreationEntryConfig extends BasicRequestParams {
    tenantId?: any;
    scope?: any;
    type?: any;
    key?: any;
    meta?: any;
    innerMeta?: any;
    unversionedData?: any;
    hidden?: any;
    recursion?: any;
    data?: any;
    links?: SyncLinks;
    includePermissionsInfo?: boolean;
    permissionsMode?: any;
    initialPermissions?: any;
    initialParentId?: any;
    isPrivateRoute?: any;
    disableCheckPermission?: any;
    verbose?: any;
    trxOverride?: any;
    useLegacyLogin?: boolean;
    mirrored?: boolean;
    mode?: Mode;
}
export interface PrivateCreationEntryConfig extends CreationEntryConfig {
    masterToken?: any;
}

export interface CheckExistenceEntriesWithInsufficientPermissions {
    permission: UsPermissions;
    entries: EntryType[];
    ctx: CTX;
    includePermissionsInfo?: boolean;
    trx?: TransactionOrKnex;
}
export interface ResolveTenantIdByEntryIdConfig extends BasicRequestParams {
    tenantId?: any;
    entryId?: any;
}
export interface CopyEntityBetweenTenantConfig {
    entryId: string;
    destinationTenantId: string;
}
