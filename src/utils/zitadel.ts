import {AppContext} from '@gravity-ui/nodekit';
import axios from 'axios';
import {nodekit} from '../nodekit';
import axiosRetry from 'axios-retry';
import {Utils} from './utils';

type IntrospectionResult = {
    active: boolean;
    name?: string;
};

axiosRetry(axios, {
    retries: 3,
});

export const introspect = async (ctx: AppContext, token?: string): Promise<IntrospectionResult> => {
    ctx.log('Token introspection');

    if (!nodekit.config.zitadelUri) {
        throw new Error('Missing ZITADEL_URI in env');
    }
    if (!nodekit.config.clientId) {
        throw new Error('Missing CLIENT_ID in env');
    }
    if (!nodekit.config.clientSecret) {
        throw new Error('Missing CLIENT_SECRET in env');
    }

    try {
        if (!token) {
            throw new Error('Token not provided');
        }

        const hrStart = process.hrtime();

        const response = await axios.post(
            `${nodekit.config.zitadelUri}/oauth/v2/introspect`,
            new URLSearchParams({token}),
            {
                auth: {
                    username: nodekit.config.clientId,
                    password: nodekit.config.clientSecret,
                },
            },
        );

        ctx.log(`Token introspected successfully within: ${Utils.getDuration(hrStart)} ms`);

        const {active, name} = response.data;
        return {active: Boolean(active), name};
    } catch (e) {
        ctx.logError('Failed to introspect token', e);
        return {active: false};
    }
};
