export type TenantMeta = {
    cloudId?: string;
    deleteContext?: {
        startAt: string;
        requestId: string;
        traceId: string;
    };
};
