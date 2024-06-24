import {AppContext} from '@gravity-ui/nodekit';
import {Utils} from './utils';
import axios from 'axios';
import axiosRetry from 'axios-retry';

enum ZitadelUserRole {
    Creator = 'creator',
    Admin = 'admin',
    Viewer = 'viewer',
}

type IntrospectionResult = {
    active: boolean;
    userId?: string;
    username?: string;
    role?: ZitadelUserRole;
};

const axiosInstance = axios.create();
axiosRetry(axiosInstance, {retries: 3});

const getRole = (data: any): ZitadelUserRole => {
    const scope = 'urn:zitadel:iam:org:project:roles';

    const roles = data[scope];

    if (!roles) {
        return ZitadelUserRole.Viewer;
    }

    if (roles['admin']) {
        return ZitadelUserRole.Admin;
    }

    if (roles['creator']) {
        return ZitadelUserRole.Creator;
    }

    return ZitadelUserRole.Viewer;
};

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

        const role = getRole(response.data);

        return {active: Boolean(active), userId: sub, username, role};
    } catch (e) {
        ctx.logError('Failed to introspect token', e);
        return {active: false};
    }
};
