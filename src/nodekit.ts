import * as path from 'path';

import {NodeKit} from '@gravity-ui/nodekit';

import {getGatewayConfig} from './components/gateway';
import {schema} from './components/gateway/schema';
import {AppEnv} from './const';
import {initDB} from './db/init-db';
import {registry} from './registry';
import {setTestingEnv} from './utils/env-utils';

// Initialization order: nodekit -> db -> gateway -> expresskit

if (process.env.APP_ENV === AppEnv.IntTesting) {
    setTestingEnv();
}

const nodekit = new NodeKit({
    disableDotEnv: process.env.APP_ENV === AppEnv.IntTesting,
    configsPath: path.resolve(__dirname, 'configs'),
});

const {appName, appEnv, appInstallation, appDevMode} = nodekit.config;
nodekit.ctx.log('AppConfig details', {
    appName,
    appEnv,
    appInstallation,
    appDevMode,
});

const {dynamicFeaturesEndpoint} = nodekit.config;

if (dynamicFeaturesEndpoint) {
    nodekit.setupDynamicConfig('features', {
        url: dynamicFeaturesEndpoint,
    });
}

const initedDB = initDB(nodekit);
registry.setupDbInstance(initedDB);

registry.setupGateway(getGatewayConfig(nodekit), {root: schema});

export {nodekit};
