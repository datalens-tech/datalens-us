export type TenantMeta = {
    cloudId?: string;
    deleteContext?: {
        startAt: string;
        requestId: string;
        traceId: string;
    };
};

type Primitive = string | boolean | number | null;
export type TenantSettingsValue = Primitive | Record<string, Primitive>;
