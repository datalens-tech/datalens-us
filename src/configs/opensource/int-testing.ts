import {AppConfig} from '@gravity-ui/nodekit';

import {features} from './common';

export default {
    features: {
        ...features,
    },
    dynamicMasterTokenPublicKeys: {
        'test-service': ['test-public-key'],
    },
} as Partial<AppConfig>;
