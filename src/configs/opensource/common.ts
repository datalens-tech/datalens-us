import {AppConfig} from '@gravity-ui/nodekit';

import {Feature, FeaturesConfig} from '../../components/features/types';
import {isTrueArg} from '../../utils/env-utils';

export const features: FeaturesConfig = {
    [Feature.ReadOnlyMode]: isTrueArg(process.env.READ_ONLY_MODE),
    [Feature.CollectionsEnabled]: true,
    [Feature.ColorPalettesEnabled]: true,
    [Feature.UseIpV6]: false,
    [Feature.WorkbookIsolationEnabled]: true,
    [Feature.DefaultColorPaletteEnabled]: true,
    [Feature.TenantsEnabled]: true,
    [Feature.TemporalEnabled]: false,
    [Feature.DynamicMasterTokenEnabled]: true,
    [Feature.DynamicMasterTokenIsRequired]: false,
};

export default {
    features,
} as Partial<AppConfig>;
