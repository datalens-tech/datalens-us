import type {
    PlatformAppConfig,
    PlatformAppContextParams,
    PlatformAppDynamicConfig,
} from '../src/types/nodekit';

declare module '@gravity-ui/nodekit' {
    interface AppConfig extends PlatformAppConfig {}
    interface AppContextParams extends PlatformAppContextParams {}
    interface AppDynamicConfig extends PlatformAppDynamicConfig {}
}

export {};
