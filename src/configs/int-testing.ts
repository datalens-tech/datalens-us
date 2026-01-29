import {AuthPolicy} from '@gravity-ui/expresskit';
import {AppConfig} from '@gravity-ui/nodekit';

export default {
    isAuthEnabled: true,
    accessServiceEnabled: true,
    appAuthPolicy: AuthPolicy.required,
    swaggerEnabled: false,
    dynamicMasterTokenPublicKeys: {
        'test-service': ['test-public-key'],
    },
} as Partial<AppConfig>;
