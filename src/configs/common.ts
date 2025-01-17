import {AuthPolicy} from '@gravity-ui/expresskit';
import {AppConfig} from '@gravity-ui/nodekit';

import {APP_NAME, US_MASTER_TOKEN_HEADER} from '../const';
import Utils from '../utils';

export default {
    appName: APP_NAME,

    appSocket: 'dist/run/server.sock',

    expressTrustProxyNumber: 3,
    expressBodyParserJSONConfig: {
        limit: '50mb',
    },
    expressBodyParserURLEncodedConfig: {
        limit: '50mb',
        extended: false,
    },

    appAuthPolicy: Utils.isTrueArg(Utils.getEnvVariable('ZITADEL'))
        ? AuthPolicy.required
        : AuthPolicy.disabled,

    appSensitiveKeys: [US_MASTER_TOKEN_HEADER],

    zitadelEnabled: Utils.isTrueArg(Utils.getEnvVariable('ZITADEL')),
    zitadelUri: Utils.getEnvVariable('ZITADEL_URI') || 'http://localhost:8080',

    clientId: Utils.getEnvVariable('CLIENT_ID') || '',
    clientSecret: Utils.getEnvVariable('CLIENT_SECRET') || '',

    multitenant: false,
    tenantIdOverride: 'common',

    dlsEnabled: false,
    accessServiceEnabled: Utils.isTrueArg(Utils.getEnvVariable('ZITADEL')),
    accessBindingsServiceEnabled: Utils.isTrueArg(Utils.getEnvVariable('ZITADEL')),

    masterToken: Utils.getEnvTokenVariable('MASTER_TOKEN'),

    features: {},

    debug: Utils.isTrueArg(Utils.getEnvVariable('DEBUG')),

    swaggerEnabled: !Utils.isTrueArg(Utils.getEnvVariable('DISABLE_SWAGGER')),
} as Partial<AppConfig>;
