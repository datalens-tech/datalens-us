import type {
    CheckCreateEntryAvailability,
    CheckUpdateEntryAvailability,
    GetEntryAddFormattedFieldsHook,
    GetEntryBeforeDbRequestHook,
    IsNeedBypassEntryByKey,
} from './types';

export const isNeedBypassEntryByKey: IsNeedBypassEntryByKey = () => false;

export const getEntryBeforeDbRequestHook: GetEntryBeforeDbRequestHook = () => Promise.resolve();

export const getEntryAddFormattedFieldsHook: GetEntryAddFormattedFieldsHook = () =>
    Promise.resolve({});

export const checkCreateEntryAvailability: CheckCreateEntryAvailability = () => Promise.resolve();

export const checkUpdateEntryAvailability: CheckUpdateEntryAvailability = () => Promise.resolve();
