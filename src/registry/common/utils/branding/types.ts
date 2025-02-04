import {Tenant} from '../../../../db/models/new/tenant';

export type CheckBrandingAvailability = (tenant: Tenant) => boolean;
