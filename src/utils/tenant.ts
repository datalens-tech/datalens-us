import {ORG_TENANT_PREFIX} from '../const';

export const isTenantIdWithOrgId = (tenantId: string) => {
    return tenantId.startsWith(ORG_TENANT_PREFIX);
};

export const getOrgIdFromTenantId = (tenantId: string) => {
    return tenantId.slice(ORG_TENANT_PREFIX.length);
};

export const makeTenantIdFromOrgId = (orgId: string) => {
    return ORG_TENANT_PREFIX + orgId;
};
