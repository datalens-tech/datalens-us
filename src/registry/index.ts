import type {ExpressKit, Request, Response} from '@gravity-ui/expresskit';
import type {AppContext} from '@gravity-ui/nodekit';
import getGatewayControllers, {
    ApiWithRoot,
    GatewayConfig,
    SchemasByScope,
} from '@gravity-ui/gateway';
import type {initDB} from '../db/init-db';
import {commonRegistry} from './common';

type DbInstance = ReturnType<typeof initDB>;

let app: ExpressKit;
let dbInstance: DbInstance;

const wrapperGetGatewayControllers = (
    schemasByScope: SchemasByScope,
    config: GatewayConfig<AppContext, Request, Response>,
) => getGatewayControllers<SchemasByScope, AppContext, Request, Response>(schemasByScope, config);

let gateway: ReturnType<typeof wrapperGetGatewayControllers>;

export type GatewayApi<TSchema extends SchemasByScope> = ApiWithRoot<
    TSchema,
    AppContext,
    Request,
    Response
>;

export const registry = {
    setupApp(appInstance: ExpressKit) {
        if (app) {
            throw new Error('The method must not be called more than once');
        }
        app = appInstance;
    },
    getApp() {
        if (!app) {
            throw new Error('First of all setup the app');
        }
        return app;
    },
    setupDbInstance(instance: DbInstance) {
        if (dbInstance) {
            throw new Error('The method must not be called more than once');
        }
        dbInstance = instance;
    },
    getDbInstance() {
        if (!dbInstance) {
            throw new Error('First of all setup the db');
        }
        return dbInstance;
    },
    setupGateway(
        config: GatewayConfig<AppContext, Request, Response>,
        schemasByScope: SchemasByScope,
    ) {
        if (gateway) {
            throw new Error('The method must not be called more than once');
        }
        gateway = wrapperGetGatewayControllers(schemasByScope, config);
    },
    getGatewayApi<TSchema extends SchemasByScope>() {
        if (!gateway) {
            throw new Error('First of all setup the gateway');
        }

        return {gatewayApi: gateway.api} as {
            gatewayApi: GatewayApi<TSchema>;
        };
    },
    common: commonRegistry,
};
