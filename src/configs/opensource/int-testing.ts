import {AppConfig} from '@gravity-ui/nodekit';
import {testTenantId} from '../../tests/int/constants';
import {features} from './common';

export default {
    tenantIdOverride: testTenantId,
    features: {
        ...features,
    },
} as Partial<AppConfig>;
