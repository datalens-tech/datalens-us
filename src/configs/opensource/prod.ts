import {AppConfig} from '@gravity-ui/nodekit';

import {Feature} from '../../components/features/types';

import {features} from './common';

export default {
    features: {
        ...features,
        [Feature.DynamicMasterTokenEnabled]: false,
    },
} as Partial<AppConfig>;
