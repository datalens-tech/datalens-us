import type {AppContext} from '@gravity-ui/nodekit';
import type {GetEntryResult} from '../../../../services/new/entry/get-entry';
import {EntryWithPermissionOnly} from '../../../../types/models';

export type IsNeedBypassEntryByKey = (ctx: AppContext, key?: string) => boolean;

export type GetEntryBeforeDbRequestHook = (args: {
    ctx: AppContext;
    entryId: string;
}) => Promise<void>;

export type GetEntryAddFormattedFieldsHook = (args: {
    ctx: AppContext;
    result: GetEntryResult;
}) => Promise<Record<string, unknown>>;

export type GetEntriesWithPermissionsOnly = (
    ctx: AppContext,
    args: {
        entries: EntryWithPermissionOnly[];
        includePermissionsInfo?: boolean;
        isPrivateRoute?: boolean;
    },
) => Promise<Map<string, EntryWithPermissionOnly>>;
