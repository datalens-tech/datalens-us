import {makeParser, zc} from '../../../../components/zod';

import type {CheckTenant, GetServicePlan, ProcessTenantSettings} from './types';

export const checkTenant: CheckTenant = () => Promise.resolve();

export const getServicePlan: GetServicePlan = () => undefined;

const validationSchema = zc.tenantSettings();

const parseSettings = makeParser(validationSchema);

export const processTenantSettings: ProcessTenantSettings = async ({key, value}) => {
    await parseSettings({key, value});
};
