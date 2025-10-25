import type {AppContext} from '@gravity-ui/nodekit';

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
    licenseAssignment?: {
        licenseAssignmentId?: string;
        expiredAt?: string | null;
        licenseType?: string;
        isActive?: boolean;
    };
}) => void;
