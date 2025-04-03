import type {AppContext} from '@gravity-ui/nodekit';

import type {GetEntryResult} from '../../../../services/new/entry/get-entry';

export type IsNeedBypassEntryByKey = (ctx: AppContext, key?: string) => boolean;

export type GetEntryBeforeDbRequestHook = (args: {
    ctx: AppContext;
    entryId: string;
}) => Promise<void>;

export type GetEntryAddFormattedFieldsHook = (args: {
    ctx: AppContext;
    result: GetEntryResult;
}) => Promise<Record<string, unknown>>;
