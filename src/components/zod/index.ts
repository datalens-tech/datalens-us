import {AppError} from '@gravity-ui/nodekit';
import {ZodError, z} from 'zod';

import {US_ERRORS} from '../../const/errors';

import * as zc from './custom-types';

const prepareError = (err: unknown): Error => {
    if (err instanceof ZodError) {
        return new AppError('Validation error', {
            code: US_ERRORS.VALIDATION_ERROR,
            details: err.issues,
        });
    } else {
        return err as Error;
    }
};

export const makeParser =
    <T extends AnySchema>(schema: T) =>
    async (data: unknown): Promise<z.infer<T>> | never => {
        try {
            const parsedData = await schema.parseAsync(data);
            return parsedData;
        } catch (err) {
            throw prepareError(err);
        }
    };

export const makeParserSync =
    <T extends AnySchema>(schema: T) =>
    (data: unknown): z.infer<T> | never => {
        try {
            const parsedData = schema.parse(data);
            return parsedData;
        } catch (err) {
            throw prepareError(err);
        }
    };

type AnySchema = z.ZodType<any, any, any>;

type MakeReqParserArgs<P, Q, B> = {
    params?: P extends AnySchema ? P : undefined;
    query?: Q extends AnySchema ? Q : undefined;
    body?: B extends AnySchema ? B : undefined;
};

type ReqParseArgs<P, Q, B> = {
    params?: P extends AnySchema ? Object : unknown;
    query?: Q extends AnySchema ? Object : unknown;
    body?: B extends AnySchema ? Object : unknown;
};

type ReqParseResult<P, Q, B> = {
    params: P extends AnySchema ? z.infer<P> : undefined;
    query: Q extends AnySchema ? z.infer<Q> : undefined;
    body: B extends AnySchema ? z.infer<B> : undefined;
};

export const makeReqParser =
    <P, Q, B>({
        params: paramsSchema,
        query: querySchema,
        body: bodySchema,
    }: MakeReqParserArgs<P, Q, B>) =>
    async ({
        params: paramsData,
        query: queryData,
        body: bodyData,
    }: ReqParseArgs<P, Q, B>): Promise<ReqParseResult<P, Q, B>> | never => {
        try {
            const paramsPromise =
                typeof paramsSchema === 'undefined'
                    ? Promise.resolve(undefined)
                    : paramsSchema.parseAsync(paramsData);
            const queryPromise =
                typeof querySchema === 'undefined'
                    ? Promise.resolve(undefined)
                    : querySchema.parseAsync(queryData);
            const bodyPromise =
                typeof bodySchema === 'undefined'
                    ? Promise.resolve(undefined)
                    : bodySchema.parseAsync(bodyData);

            const [params, query, body] = await Promise.all([
                paramsPromise,
                queryPromise,
                bodyPromise,
            ]);

            return {params, query, body};
        } catch (err) {
            throw prepareError(err);
        }
    };

export const makeReqParserSync =
    <P, Q, B>({
        params: paramsSchema,
        query: querySchema,
        body: bodySchema,
    }: MakeReqParserArgs<P, Q, B>) =>
    ({
        params: paramsData,
        query: queryData,
        body: bodyData,
    }: ReqParseArgs<P, Q, B>): ReqParseResult<P, Q, B> | never => {
        try {
            return {
                params:
                    typeof paramsSchema === 'undefined'
                        ? undefined
                        : paramsSchema.parse(paramsData),
                query:
                    typeof querySchema === 'undefined' ? undefined : querySchema.parse(queryData),
                body: typeof bodySchema === 'undefined' ? undefined : bodySchema.parse(bodyData),
            };
        } catch (err) {
            throw prepareError(err);
        }
    };

export {z};
export {zc};
