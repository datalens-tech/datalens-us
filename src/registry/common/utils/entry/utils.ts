import type {
    IsNeedBypassEntryByKey,
    GetEntryBeforeDbRequestHook,
    GetEntryAddFormattedFieldsHook,
    GetEntriesWithPermissionsOnly,
} from './types';

export const isNeedBypassEntryByKey: IsNeedBypassEntryByKey = () => false;

export const getEntryBeforeDbRequestHook: GetEntryBeforeDbRequestHook = () => Promise.resolve();

export const getEntryAddFormattedFieldsHook: GetEntryAddFormattedFieldsHook = () =>
    Promise.resolve({});

export const getEntriesWithPermissionsOnly: GetEntriesWithPermissionsOnly = () =>
    Promise.resolve(new Map());
