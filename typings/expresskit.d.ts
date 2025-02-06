import type {PlatformAppRouteHandler, PlatformAppRouteParams} from '../src/types/expresskit';

declare module '@gravity-ui/expresskit' {
    interface AppRouteParams extends PlatformAppRouteParams {}
    interface AppRouteHandler extends PlatformAppRouteHandler {}
}

export {};
