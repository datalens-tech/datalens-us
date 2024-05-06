import {AppContext} from '@gravity-ui/nodekit';
import axios from 'axios';
import {nodekit} from '../nodekit';
import {IntrospectionResult} from '../types/models';

export const introspect = async (ctx: AppContext, token?: string): Promise<IntrospectionResult> => {
    ctx.log('Token introspection');

    try {
        if (!token) {
            throw new Error('Token not provided');
        }

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

        ctx.log(`Token introspected successfully`);

        const {active, name} = response.data;
        return {active: Boolean(active), name};
    } catch (e) {
        ctx.logError('Failed to introspect token', e);
        return {active: false};
    }
};
