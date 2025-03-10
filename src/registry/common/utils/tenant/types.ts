import type {AppContext} from '@gravity-ui/nodekit';

import {Tenant, TenantColumn} from '../../../../db/models/new/tenant';
import {WorkbookColumns} from '../../../../types/models';

export type CheckTenant = (args: {
    ctx: AppContext;
    tenantId: string;
    servicePlan?: string;
    features?: string[];
    workbookId?: WorkbookColumns['workbookId'] | null;
}) => Promise<void>;

export type GetServicePlan = (
    args: Pick<Tenant, typeof TenantColumn.BillingEndedAt | typeof TenantColumn.BillingStartedAt>,
) => string | undefined;
