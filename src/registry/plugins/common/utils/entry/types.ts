import type {AppContext} from '@gravity-ui/nodekit';

import type {LicenseType} from '../../../../../db/models/new/license/types';

export type IsNeedBypassEntryByKey = (ctx: AppContext, key?: string) => boolean;

export type GetEntryBeforeDbRequestHook = (args: {
    ctx: AppContext;
    entryId: string;
}) => Promise<void>;

export type GetEntryAddFormattedFieldsHook = (args: {ctx: AppContext}) => Record<string, unknown>;

export type GetEntryResolveUserLogin = (args: {ctx: AppContext}) => Promise<string | undefined>;

export type IsLicenseRequired = (args: {ctx: AppContext}) => boolean;

export type CheckLicense = (args: {
    ctx: AppContext;
    license?: {
        licenseId: string;
        expiresAt: string | null;
        licenseType: `${LicenseType}`;
        isActive: boolean;
    };
}) => void;

export type FetchAndValidateLicense = (args: {ctx: AppContext}) => Promise<void>;
