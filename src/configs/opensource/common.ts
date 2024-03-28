import {AppConfig} from '@gravity-ui/nodekit';
import {Feature, FeaturesConfig} from '../../components/features/types';

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
    features,
} as Partial<AppConfig>;
