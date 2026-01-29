import type {Request, Response} from '@gravity-ui/expresskit';
import type {ApiServiceActionConfig} from '@gravity-ui/gateway';
import type {AppContext} from '@gravity-ui/nodekit';
import type {AxiosRequestConfig} from 'axios';

export function createAction<TOutput, TParams = undefined, TTransformed = TOutput>(
    config: ApiServiceActionConfig<AppContext, Request, Response, TOutput, TParams, TTransformed>,
) {
    return config;
}

export const defaultParamsSerializer: AxiosRequestConfig['paramsSerializer'] = (queryParams) => {
    const searchParams = new URLSearchParams();

    Object.entries(queryParams).forEach(([key, value]) => {
        if (Array.isArray(value)) {
            value.forEach((v) => searchParams.append(key, v));
        } else if (value !== null && value !== undefined) {
            searchParams.append(key, value);
        }
    });

    return searchParams.toString();
};
