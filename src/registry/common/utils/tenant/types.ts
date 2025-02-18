import type {AppContext} from '@gravity-ui/nodekit';

import {Tenant, TenantColumn} from '../../../../db/models/new/tenant';

export type CheckServicePlanAvailability = (args: {
    ctx: AppContext;
    tenantId: string;
    servicePlan?: string;
}) => Promise<void>;

export type GetServicePlan = (
    args: Pick<Tenant, typeof TenantColumn.BillingEndedAt | typeof TenantColumn.BillingStartedAt>,
) => string | undefined;
