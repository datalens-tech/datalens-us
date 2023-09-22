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
} from './components/middlewares';
import {AppEnv} from './const';
import {registry} from './registry';
import {getRoutes} from './routes';

registerAppPlugins();

const beforeAuth: AppMiddleware[] = [];
const afterAuth: AppMiddleware[] = [];

if (nodekit.config.appDevMode) {
    require('source-map-support').install();
}

if (
    (nodekit.config.appEnv === AppEnv.IntTesting || nodekit.config.appEnv === AppEnv.Development) &&
    nodekit.config.appAuthPolicy === AuthPolicy.disabled
) {
    beforeAuth.push(setCiEnv);
}

afterAuth.push(decodeId);

afterAuth.push(
    dlContext,
    resolveTenantId,
    waitDatabase,
    resolveSpecialTokens,
    ctx,
    checkReadOnlyMode,
);

nodekit.config.appFinalErrorHandler = finalRequestHandler;

const extendedRoutes = getRoutes(nodekit, {beforeAuth, afterAuth});

const routes: AppRoutes = {};
Object.keys(extendedRoutes).forEach((key) => {
    const {route, ...params} = extendedRoutes[key];
    routes[route] = params;
});

const app = new ExpressKit(nodekit, routes);
registry.setupApp(app);

if (require.main === module) {
    app.run();
}

// it is allowed to use directly only for tests, in the application it must be used only through the registry
export default app;
