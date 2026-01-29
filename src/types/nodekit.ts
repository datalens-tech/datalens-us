import type {CtxUser} from '../components/auth/types/user';
import {FeaturesConfig} from '../components/features/types';
import type {TemporalConfig} from '../components/temporal/types';
import type {Registry} from '../registry';

import {CtxInfo} from './ctx';

export interface PlatformAppConfig {
    features: FeaturesConfig;
    dynamicFeaturesEndpoint?: string;

    multitenant: boolean;
    dlsEnabled: boolean;
    tenantIdOverride?: string;

    accessServiceEnabled: boolean;
    accessBindingsServiceEnabled: boolean;

    masterToken: string[];

    // auth
    isAuthEnabled?: boolean;
    authTokenPublicKey?: string;

    swaggerEnabled?: boolean;

    temporal?: TemporalConfig;

    dynamicMasterTokenPublicKeys?: Record<string, (string | undefined)[]>;
}

export interface PlatformAppContextParams {
    info: CtxInfo;
    registry: Registry;
    // auth
    user?: CtxUser;
}

export interface PlatformAppDynamicConfig {
    features?: FeaturesConfig;
}
