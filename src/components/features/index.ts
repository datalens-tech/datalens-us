import type {AppContext} from '@gravity-ui/nodekit';

import {Feature} from './types';
import {isAuthFeature} from './auth';

export const isEnabledFeature = (ctx: AppContext, feature: Feature) => {
    const featureDynamicStatus = ctx.dynamicConfig?.features?.[feature];

    if (typeof featureDynamicStatus !== 'undefined') {
        return featureDynamicStatus;
    }

    return ctx.config.features[feature] ?? false;
};

export {Feature};
export {isAuthFeature};
