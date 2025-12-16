export type TenantMeta = {
    cloudId?: string;
    deleteContext?: {
        startAt: string;
        requestId: string;
        traceId: string;
    };
};

export type TenantSettingsValue =
    | string
    | boolean
    | number
    | null
    | Record<string, string | boolean | number | null>;
