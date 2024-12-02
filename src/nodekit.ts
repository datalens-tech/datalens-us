/* eslint-disable import/order */
import dotenv from 'dotenv';
dotenv.config();

import * as path from 'path';

import {NodeKit} from '@gravity-ui/nodekit';

import {getGatewayConfig} from './components/gateway';
import {schema} from './components/gateway/schema';
import {initDB} from './db/init-db';
import {registry} from './registry';

// Initialization order: nodekit -> db -> gateway -> expresskit
const nodekit = new NodeKit({
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
