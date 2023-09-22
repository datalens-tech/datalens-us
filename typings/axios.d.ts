import {IAxiosRetryConfig} from 'axios-retry';

declare module 'axios' {
    export interface AxiosRequestConfig {
        'axios-retry'?: IAxiosRetryConfig;
    }
}
