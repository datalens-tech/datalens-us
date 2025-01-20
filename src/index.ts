/* eslint-disable import/order */
import {nodekit} from './nodekit';
import {registerAppPlugins} from './registry/register-app-plugins';
import {AppMiddleware, AppRoutes, AuthPolicy, ExpressKit} from '@gravity-ui/expresskit';
import {
    authZitadel,
    checkReadOnlyMode,
    ctx,
    decodeId,
    dlContext,
    finalRequestHandler,
    resolveSpecialTokens,
    resolveTenantId,
    resolveWorkbookId,
    setCiEnv,
    waitDatabase,
} from './components/middlewares';
import {appAuth} from './components/auth/middlewares/app-auth';
import {AppEnv} from './const';
import {registry} from './registry';
import {getRoutes} from './routes';
import {setRegistryToContext} from './components/app-context';
import {isEnabledFeature} from './components/features';
import {getAdditionalHeaders, initSwagger, registerApiRoute} from './components/api-docs';
import {objectKeys} from './utils/utility-types';

setRegistryToContext(nodekit, registry);
registerAppPlugins();

const beforeAuth: AppMiddleware[] = [];
const afterAuth: AppMiddleware[] = [];

if (nodekit.config.appDevMode) {
    require('source-map-support').install();
}

if (
    nodekit.config.appEnv === AppEnv.Development &&
    nodekit.config.appAuthPolicy === AuthPolicy.disabled
) {
    beforeAuth.push(setCiEnv);
}

afterAuth.push(decodeId);

afterAuth.push(
    dlContext,
    resolveTenantId,
    resolveWorkbookId,
    waitDatabase,
    resolveSpecialTokens,
    ctx,
    checkReadOnlyMode,
);

if (nodekit.config.zitadelEnabled) {
    nodekit.config.appAuthHandler = authZitadel;
}

if (nodekit.config.isAuthEnabled) {
    nodekit.config.appAuthHandler = appAuth;
}

nodekit.config.appFinalErrorHandler = finalRequestHandler;

const extendedRoutes = getRoutes(nodekit, {beforeAuth, afterAuth});

const routes: AppRoutes = {};
objectKeys(extendedRoutes).forEach((key) => {
    const {route, features, ...params} = extendedRoutes[key];
    if (
        !Array.isArray(features) ||
        features.every((feature) => isEnabledFeature(nodekit.ctx, feature))
    ) {
        if (nodekit.config.swaggerEnabled) {
            registerApiRoute(
                extendedRoutes[key],
                getAdditionalHeaders(extendedRoutes[key], nodekit),
            );
        }

        routes[route] = {
            ...params,
            manualDecodeId: extendedRoutes[key].handler.manualDecodeId,
        };
    }
});

const app = new ExpressKit(nodekit, routes);
registry.setupApp(app);

if (nodekit.config.swaggerEnabled) {
    initSwagger(app);
}

if (require.main === module) {
    app.run();
}

// it is allowed to use directly only for tests, in the application it must be used only through the registry
export default app;
