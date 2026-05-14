import {
    type OpenApiRegistryConfig,
    type SecuritySchemeObject,
    createOpenApiRegistry,
} from '@gravity-ui/expresskit-api';
import {NodeKit} from '@gravity-ui/nodekit';

export {
    getAdditionalHeaders,
    getAdditionalSecuritySchemes,
    registerApiRoute,
    appValidationErrorHandler,
} from './utils';
export {ApiTag, SecurityType} from './constants';
export {
    AdditionalHeader,
    GetAdditionalHeadersResult,
    GetAdditionalSecuritySchemesResult,
} from './types';

export const initSwagger = ({
    nodekit,
    securitySchemes,
    transformOperation,
}: {
    nodekit: NodeKit;
    securitySchemes?: Record<string, SecuritySchemeObject>;
    transformOperation?: OpenApiRegistryConfig['transformOperation'];
}) => {
    const config = nodekit.config;
    const installationText = `Installation – <b>${config.appInstallation}</b>`;
    const envText = `Env – <b>${config.appEnv}</b>`;
    const descriptionText = `<br />Storage for DataLens entities.`;

    const openApiRegistry = createOpenApiRegistry({
        enabled: config.swaggerEnabled,
        path: '/api-docs',
        title: 'United Storage',
        version: config.appVersion,
        servers: [{url: '/'}],
        securitySchemes,
        description: [installationText, envText, descriptionText].join('<br />'),
        transformOperation,
        skipMount: true,
    });

    return openApiRegistry;
};
