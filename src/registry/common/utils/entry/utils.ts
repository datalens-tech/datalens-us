import type {
    GetEntryAddFormattedFieldsHook,
    GetEntryBeforeDbRequestHook,
    IsNeedBypassEntryByKey,
} from './types';

export const isNeedBypassEntryByKey: IsNeedBypassEntryByKey = () => false;

export const getEntryBeforeDbRequestHook: GetEntryBeforeDbRequestHook = () => Promise.resolve();

export const getEntryAddFormattedFieldsHook: GetEntryAddFormattedFieldsHook = () =>
    Promise.resolve({});
