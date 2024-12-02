import {AppConfig} from '@gravity-ui/nodekit';

import {features} from './common';

export default {
    features: {
        ...features,
    },
} as Partial<AppConfig>;
