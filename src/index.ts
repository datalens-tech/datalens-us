import {nodekit} from './nodekit';
import {registerAppPlugins} from './registry/register-app-plugins';
import {ExpressKit, AppMiddleware, AuthPolicy, AppRoutes} from '@gravity-ui/expresskit';
import {
    decodeId,
    resolveTenantId,
    resolveSpecialTokens,
    waitDatabase,
    setCiEnv,
    dlContext,
    ctx,
    finalRequestHandler,
    checkReadOnlyMode,
    resolveWorkbookId,
    authZitadel,
} from './components/middlewares';
import {AppEnv} from './const';
import {registry} from './registry';
import {getRoutes} from './routes';
import {setRegistryToContext} from './components/app-context';
import {isEnabledFeature} from './components/features';
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

nodekit.config.appFinalErrorHandler = finalRequestHandler;

const extendedRoutes = getRoutes(nodekit, {beforeAuth, afterAuth});

const routes: AppRoutes = {};
objectKeys(extendedRoutes).forEach((key) => {
    const {route, feat, ...params} = extendedRoutes[key];
    if (!Array.isArray(feat) || feat.every((flag) => isEnabledFeature(nodekit.ctx, flag))) {
        routes[route] = params;
    }
});

const app = new ExpressKit(nodekit, routes);
registry.setupApp(app);

if (require.main === module) {
    app.run();
}

// it is allowed to use directly only for tests, in the application it must be used only through the registry
export default app;
