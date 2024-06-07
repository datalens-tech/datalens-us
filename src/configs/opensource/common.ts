import {AppConfig} from '@gravity-ui/nodekit';
import {Feature, FeaturesConfig} from '../../components/features/types';
import {DL_SERVICE_USER_ACCESS_TOKEN} from '../../const';

export const features: FeaturesConfig = {
    [Feature.ReadOnlyMode]: false,
    [Feature.CollectionsEnabled]: true,
    [Feature.ColorPalettesEnabled]: true,
    [Feature.UseIpV6]: false,
    [Feature.ProjectsEnabled]: false,
    [Feature.UseLimitedView]: true,
    [Feature.WorkbookIsolationEnabled]: true,
};

export default {
    appSensitiveKeys: [DL_SERVICE_USER_ACCESS_TOKEN],
    appSensitiveHeaders: [DL_SERVICE_USER_ACCESS_TOKEN],
    features,
} as Partial<AppConfig>;
