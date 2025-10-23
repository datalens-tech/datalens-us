import type {
    CheckLicense,
    GetEntryAddFormattedFieldsHook,
    GetEntryBeforeDbRequestHook,
    GetEntryResolveUserLogin,
    IsLicenseRequired,
    IsNeedBypassEntryByKey,
} from './types';

export const isNeedBypassEntryByKey: IsNeedBypassEntryByKey = () => false;

export const getEntryBeforeDbRequestHook: GetEntryBeforeDbRequestHook = () => Promise.resolve();

export const getEntryAddFormattedFieldsHook: GetEntryAddFormattedFieldsHook = () => ({});

export const getEntryResolveUserLogin: GetEntryResolveUserLogin = () => Promise.resolve(undefined);

export const isLicenseRequired: IsLicenseRequired = () => {
    return false;
};

export const checkLicense: CheckLicense = async () => {
    return;
};
