import type {
    IsNeedBypassEntryByKey,
    GetEntryBeforeDbRequestHook,
    GetEntryAddFormattedFieldsHook,
} from './types';

export const isNeedBypassEntryByKey: IsNeedBypassEntryByKey = () => false;

export const getEntryBeforeDbRequestHook: GetEntryBeforeDbRequestHook = () => Promise.resolve();

export const getEntryAddFormattedFieldsHook: GetEntryAddFormattedFieldsHook = () =>
    Promise.resolve({});
