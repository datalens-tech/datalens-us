#!/usr/bin/env node
'use strict';

const path = require('path');
const {readFileSync, writeFileSync, openSync} = require('fs');

const SECRETS_SECTION_START = '### TEMPLATE SECRETS BEGIN';
const SECRETS_SECTION_END = '### TEMPLATE SECRETS END';
const REPLACE_REGEXP = new RegExp(`^${SECRETS_SECTION_START}.*${SECRETS_SECTION_END}$`, 'ms', 's');

const installationName = process.argv[2];
const envName = process.env.ENV || 'development';
const templateName = `${installationName}/${envName}.env`;

const appPath = path.join(__dirname, '..');
const templateFilePath = path.join(appPath, `dev/env/${templateName}`);

let templateContent = readFileSync(templateFilePath).toString();

if (envName === 'development') {
    try {
        const developmentEnvPart = readFileSync(path.join(appPath, '.env.development')).toString();
        templateContent += `\n${developmentEnvPart}`;
    } catch (err) {
        throw new Error(
            'For `development` installation you must add `.env.development` file to the root of project, and define `POSTGRES_DSN_LIST` variable with your development database credentials!',
        );
    }
}

const templateSection = `${SECRETS_SECTION_START}\n${templateContent}\n${SECRETS_SECTION_END}`;

let currentEnv;

try {
    currentEnv = readFileSync(path.join(appPath, '.env')).toString();
} catch (__) {
    openSync(path.join(appPath, '.env'), 'w');

    currentEnv = `${SECRETS_SECTION_START}\n${SECRETS_SECTION_END}`;
}

writeFileSync(path.join(appPath, '.env'), currentEnv.replace(REPLACE_REGEXP, templateSection));
