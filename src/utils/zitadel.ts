import {AppContext} from '@gravity-ui/nodekit';
import {Utils} from './utils';
import axios from 'axios';
import axiosRetry from 'axios-retry';
import {ZitadelUserRole} from '../types/zitadel';
import {registry} from '../registry';

type IntrospectionResult = {
    active: boolean;
    userId?: string;
    username?: string;
    role?: ZitadelUserRole;
};

const axiosInstance = axios.create();
axiosRetry(axiosInstance, {retries: 3});

export const introspect = async (ctx: AppContext, token?: string): Promise<IntrospectionResult> => {
    ctx.log('Token introspection');

    if (!ctx.config.zitadelUri) {
        throw new Error('Missing ZITADEL_URI in env');
    }
    if (!ctx.config.clientId) {
        throw new Error('Missing CLIENT_ID in env');
    }
    if (!ctx.config.clientSecret) {
        throw new Error('Missing CLIENT_SECRET in env');
    }

    try {
        if (!token) {
            throw new Error('Token not provided');
        }

        const hrStart = process.hrtime();

        const response = await axiosInstance({
            method: 'post',
            url: `${ctx.config.zitadelUri}/oauth/v2/introspect`,
            auth: {
                username: ctx.config.clientId,
                password: ctx.config.clientSecret,
            },
            params: {
                token,
            },
        });

        ctx.log(`Token introspected successfully within: ${Utils.getDuration(hrStart)} ms`);

        const {active, username, sub} = response.data;

        const {getZitadelUserRole} = registry.common.functions.get();

        const role = getZitadelUserRole(response.data);

        return {active: Boolean(active), userId: sub, username, role};
    } catch (e) {
        ctx.logError('Failed to introspect token', e);
        return {active: false};
    }
};
