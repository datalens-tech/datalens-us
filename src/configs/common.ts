import {AuthPolicy} from '@gravity-ui/expresskit';
import {AppConfig} from '@gravity-ui/nodekit';

import {
    APP_NAME,
    DL_SERVICE_USER_ACCESS_TOKEN,
    US_DYNAMIC_MASTER_TOKEN_HEADER,
    US_MASTER_TOKEN_HEADER,
} from '../const';
import {getEnvCert, getEnvTokenVariable, getEnvVariable, isTrueArg} from '../utils/env-utils';

const isZitadelEnabled = isTrueArg(getEnvVariable('ZITADEL'));
const isAuthEnabled = isTrueArg(getEnvVariable('AUTH_ENABLED'));
const isAuthServiceEnabled = isZitadelEnabled || isAuthEnabled;

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

    appAuthPolicy: isAuthServiceEnabled ? AuthPolicy.required : AuthPolicy.disabled,

    appSensitiveKeys: [
        US_MASTER_TOKEN_HEADER,
        US_DYNAMIC_MASTER_TOKEN_HEADER,
        DL_SERVICE_USER_ACCESS_TOKEN,
    ],
    appSensitiveHeaders: [
        US_MASTER_TOKEN_HEADER,
        US_DYNAMIC_MASTER_TOKEN_HEADER,
        DL_SERVICE_USER_ACCESS_TOKEN,
    ],

    // zitadel
    zitadelEnabled: isZitadelEnabled,
    zitadelUri: getEnvVariable('ZITADEL_URI') || 'http://localhost:8080',
    clientId: getEnvVariable('CLIENT_ID') || '',
    clientSecret: getEnvVariable('CLIENT_SECRET') || '',

    // auth
    isAuthEnabled: isAuthEnabled,
    authTokenPublicKey: getEnvCert(process.env.AUTH_TOKEN_PUBLIC_KEY),

    multitenant: false,
    tenantIdOverride: 'common',

    dlsEnabled: false,
    accessServiceEnabled: isAuthServiceEnabled,
    accessBindingsServiceEnabled: isAuthServiceEnabled,

    masterToken: getEnvTokenVariable('MASTER_TOKEN'),

    features: {},

    debug: isTrueArg(getEnvVariable('DEBUG')),

    swaggerEnabled: !isTrueArg(getEnvVariable('DISABLE_SWAGGER')),

    temporal: {
        address: getEnvVariable('TEMPORAL_ADDRESS') || 'localhost:7233',
        namespace: getEnvVariable('TEMPORAL_NAMESPACE') || 'default',
    },

    dynamicMasterTokenPublicKeys: {
        ui: [
            getEnvCert(process.env.UI_MASTER_TOKEN_PUBLIC_KEY_PRIMARY),
            getEnvCert(process.env.UI_MASTER_TOKEN_PUBLIC_KEY_SECONDARY),
        ],
        bi: [
            getEnvCert(process.env.BI_MASTER_TOKEN_PUBLIC_KEY_PRIMARY),
            getEnvCert(process.env.BI_MASTER_TOKEN_PUBLIC_KEY_SECONDARY),
        ],
    },
} as Partial<AppConfig>;
