import {CtxInfo} from '../src/types/ctx';
import {FeaturesConfig} from '../src/components/features/types';
declare module '@gravity-ui/nodekit' {
    interface AppConfig {
        features: FeaturesConfig;
        dynamicFeaturesEndpoint?: string;

        multitenant: boolean;
        dlsEnabled: boolean;
        tenantIdOverride?: string;

        accessServiceEnabled: boolean;
        accessBindingsServiceEnabled: boolean;

        masterToken: string[];
    }

    interface AppDynamicConfig {
        features?: FeaturesConfig;
    }

    interface AppContextParams {
        info: CtxInfo;
    }
}

declare module '@gravity-ui/expresskit' {
    interface AppRouteParams {
        private?: boolean;
        write?: boolean;
    }
}
