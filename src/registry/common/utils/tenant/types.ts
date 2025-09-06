import type {AppContext} from '@gravity-ui/nodekit';
import {TransactionOrKnex} from 'objection';

import {Tenant, TenantColumn} from '../../../../db/models/new/tenant';

export type CheckTenant = (args: {
    ctx: AppContext;
    tenantId: string;
    servicePlan?: string;
    features?: string[];
    foldersEnabled?: boolean;
}) => Promise<void>;

export type GetServicePlan = (
    args: Pick<Tenant, typeof TenantColumn.BillingEndedAt | typeof TenantColumn.BillingStartedAt>,
) => string | undefined;

export type ProcessTenantSettings = (args: {
    ctx: AppContext;
    trx?: TransactionOrKnex;
    key: string;
    value: string | boolean | number;
}) => Promise<void>;
