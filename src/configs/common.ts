import {AppConfig} from '@gravity-ui/nodekit';
import {AuthPolicy} from '@gravity-ui/expresskit';
import {US_MASTER_TOKEN_HEADER, Zitadel} from '../const';
import Utils from '../utils';

export default {
    appName: 'united-storage',

    //appSocket: 'dist/run/server.sock',
    appPort: 8083,
    expressTrustProxyNumber: 3,
    expressBodyParserJSONConfig: {
        limit: '50mb',
    },
    expressBodyParserURLEncodedConfig: {
        limit: '50mb',
        extended: false,
    },

    appAuthPolicy:
        Utils.getEnvVariable('ZITADEL') === Zitadel.Enabled
            ? AuthPolicy.required
            : AuthPolicy.disabled,

    appSensitiveKeys: [US_MASTER_TOKEN_HEADER],

    zitadelEnabled: Utils.getEnvVariable('ZITADEL') === Zitadel.Enabled,
    zitadelUri: Utils.getEnvVariable('ZITADEL_URI') || 'http://localhost:8080',

    clientId: Utils.getEnvVariable('CLIENT_ID') || '',
    clientSecret: Utils.getEnvVariable('CLIENT_SECRET') || '',

    multitenant: false,
    tenantIdOverride: 'common',

    dlsEnabled: false,
    accessServiceEnabled: false,
    accessBindingsServiceEnabled: false,

    masterToken: Utils.getEnvTokenVariable('MASTER_TOKEN'),

    features: {},

    debug: Utils.isTrueArg(Utils.getEnvVariable('DEBUG')),
} as Partial<AppConfig>;
