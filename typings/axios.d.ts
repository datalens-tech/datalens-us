import {IAxiosRetryConfig} from 'axios-retry';

declare module 'axios' {
    interface AxiosRequestConfig {
        'axios-retry'?: IAxiosRetryConfig;
    }
}
