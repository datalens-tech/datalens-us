import {AppContext} from '@gravity-ui/nodekit';
import {nodekit} from '../nodekit';
import {Utils} from './utils';
import axios from 'axios';
import axiosRetry from 'axios-retry';

type IntrospectionResult = {
    active: boolean;
    userId?: string;
    username?: string;
};

const axiosInstance = axios.create();
axiosRetry(axiosInstance, {retries: 3});

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

        const response = await axiosInstance({
            method: 'post',
            url: `${nodekit.config.zitadelUri}/oauth/v2/introspect`,
            auth: {
                username: nodekit.config.clientId,
                password: nodekit.config.clientSecret,
            },
            params: {
                token,
            },
        });

        ctx.log(`Token introspected successfully within: ${Utils.getDuration(hrStart)} ms`);

        const {active, username, sub} = response.data;
        return {active: Boolean(active), userId: sub, username};
    } catch (e) {
        ctx.logError('Failed to introspect token', e);
        return {active: false};
    }
};
