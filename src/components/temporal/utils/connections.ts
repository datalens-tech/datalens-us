import type {AppContext} from '@gravity-ui/nodekit';
import type {TLSConfig} from '@temporalio/common/lib/internal-non-workflow';

export type ConnectionOptions = {
    address?: string;
    tls?: TLSConfig | boolean | null;
};

export const getConnectionOptions = (ctx: AppContext): ConnectionOptions => {
    const {address, tls} = ctx.config.temporal || {};

    return {
        address,
        tls,
    };
};
