import {ActionTimeoutError} from '../../components/errors';

export const withTimeout = async <T>(
    promise: Promise<T>,
    {timeoutMs, errorMessage}: {timeoutMs: number; errorMessage: string},
): Promise<T> => {
    const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
            reject(new ActionTimeoutError({message: errorMessage}));
        }, timeoutMs);
    });

    return Promise.race([promise, timeoutPromise]);
};
