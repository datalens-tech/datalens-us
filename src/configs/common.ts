import {AppConfig} from '@gravity-ui/nodekit';
import {AuthPolicy} from '@gravity-ui/expresskit';
import {US_MASTER_TOKEN_HEADER} from '../const';
import Utils from '../utils';

export default {
    appName: 'united-storage',

    appSocket: 'dist/run/server.sock',
    expressTrustProxyNumber: 3,
    expressBodyParserJSONConfig: {
        limit: '50mb',
    },
    expressBodyParserURLEncodedConfig: {
        limit: '50mb',
        extended: false,
    },

    appAuthPolicy: AuthPolicy.disabled,

    appSensitiveKeys: [US_MASTER_TOKEN_HEADER],

    multitenant: false,
    tenantIdOverride: 'common',

    dlsEnabled: false,
    accessServiceEnabled: false,
    accessBindingsServiceEnabled: false,

    masterToken: Utils.getEnvTokenVariable('MASTER_TOKEN'),

    features: {},

    debug: Utils.isTrueArg(Utils.getEnvVariable('DEBUG')),
} as Partial<AppConfig>;
