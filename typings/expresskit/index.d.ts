import type {PlatformAppRouteHandler, PlatformAppRouteParams} from './types';

declare module '@gravity-ui/expresskit' {
    interface AppRouteParams extends PlatformAppRouteParams {}
    interface AppRouteHandler extends PlatformAppRouteHandler {}
}

export {};
