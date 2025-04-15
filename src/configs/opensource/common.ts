import {AppConfig} from '@gravity-ui/nodekit';

import {Feature, FeaturesConfig} from '../../components/features/types';
import {DL_SERVICE_USER_ACCESS_TOKEN} from '../../const';
import {isTrueArg} from '../../utils/env-utils';

export const features: FeaturesConfig = {
    [Feature.ReadOnlyMode]: isTrueArg(process.env.READ_ONLY_MODE),
    [Feature.CollectionsEnabled]: true,
    [Feature.ColorPalettesEnabled]: true,
    [Feature.UseIpV6]: false,
    [Feature.WorkbookIsolationEnabled]: true,
};

export default {
    appSensitiveKeys: [DL_SERVICE_USER_ACCESS_TOKEN],
    appSensitiveHeaders: [DL_SERVICE_USER_ACCESS_TOKEN],
    features,
} as Partial<AppConfig>;
