import http from 'http';
import https from 'https';

import axios from 'axios';
import axiosRetry from 'axios-retry';

const client = axios.create();

axiosRetry(client, {
    retries: 0,
    retryDelay: axiosRetry.exponentialDelay,
});

export const IPV6_AXIOS_OPTIONS = {
    httpAgent: new http.Agent({
        //@ts-ignore https://github.com/nodejs/node/blob/master/lib/_http_agent.js#L233
        family: 6,
    }),
    httpsAgent: new https.Agent({
        //@ts-ignore https://github.com/nodejs/node/blob/master/lib/_http_agent.js#L233
        family: 6,
    }),
};

export default client;
