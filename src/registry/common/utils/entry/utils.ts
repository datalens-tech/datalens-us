import type {
    GetEntryAddFormattedFieldsHook,
    GetEntryBeforeDbRequestHook,
    GetEntryResolveUserLogin,
    IsNeedBypassEntryByKey,
} from './types';

export const isNeedBypassEntryByKey: IsNeedBypassEntryByKey = () => false;

export const getEntryBeforeDbRequestHook: GetEntryBeforeDbRequestHook = () => Promise.resolve();

export const getEntryAddFormattedFieldsHook: GetEntryAddFormattedFieldsHook = () => ({});

export const getEntryResolveUserLogin: GetEntryResolveUserLogin = () => Promise.resolve(undefined);
