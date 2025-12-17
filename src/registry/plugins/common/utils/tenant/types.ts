import type {AppContext} from '@gravity-ui/nodekit';
import {TransactionOrKnex} from 'objection';

import {TenantSettingsValue} from '../../../../../types/models';

export type CheckTenant = (args: {
    ctx: AppContext;
    tenantId: string;
    servicePlan?: string;
    features?: string[];
    foldersEnabled?: boolean;
}) => Promise<void>;

export type GetServicePlan = (args: {
    ctx: AppContext;
    billingStartedAt: Nullable<string>;
    billingEndedAt: Nullable<string>;
}) => string | undefined;

export type ProcessTenantSettings = (args: {
    ctx: AppContext;
    trx?: TransactionOrKnex;
    key: string;
    value: TenantSettingsValue;
}) => Promise<void>;
