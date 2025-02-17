import type {AppContext} from '@gravity-ui/nodekit';

export type CheckServicePlanAvailability = (args: {
    ctx: AppContext;
    tenantId: string;
    checkServicePlan?: string;
}) => Promise<void>;

export type GetServicePlan = (args: {
    ctx: AppContext;
    tenantId: string;
}) => Promise<string | undefined>;
