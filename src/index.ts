/* eslint-disable import/order */
import {nodekit} from './nodekit';
import {AppMiddleware, AppRoutes, AuthPolicy, ExpressKit} from '@gravity-ui/expresskit';
import {
    authZitadel,
    checkCtxTenantId,
    checkReadOnlyMode,
    ctx,
    decodeId,
    dlContext,
    finalRequestHandler,
    resolveIsolationIds,
    resolveSpecialTokens,
    resolveTenantId,
    setCiEnv,
    waitDatabase,
} from './components/middlewares';
import {appAuth} from './components/auth/middlewares/app-auth';
import {AppEnv} from './const';
import {registry} from './registry';
import {setRegistryToContext} from './registry/utils';
import {setupRegistryPlugins} from './registry/setup';
import {getRoutes} from './routes';
import {Feature, isEnabledFeature} from './components/features';
import {
    getAdditionalHeaders,
    getAdditionalSecuritySchemes,
    initSwagger,
    registerApiRoute,
} from './components/api-docs';
import {objectKeys} from './utils/utility-types';
import {initTemporal} from './components/temporal/init-temporal';

setRegistryToContext(nodekit, registry);
setupRegistryPlugins();

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
    resolveIsolationIds,
    waitDatabase,
    resolveSpecialTokens,
    ctx,
    checkReadOnlyMode,
    checkCtxTenantId,
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
    initSwagger(app, getAdditionalSecuritySchemes(nodekit));
}

if (require.main === module) {
    if (isEnabledFeature(nodekit.ctx, Feature.TemporalEnabled)) {
        initTemporal({ctx: nodekit.ctx});
    }

    app.run();
}

// it is allowed to use directly only for tests, in the application it must be used only through the registry
export default app;
