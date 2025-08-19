import {AppError} from '@gravity-ui/nodekit';

import {US_ERRORS} from '../../const';

export const withTimeout = async <T>(
    promise: Promise<T>,
    {timeoutMs, errorMessage}: {timeoutMs: number; errorMessage: string},
): Promise<T> => {
    const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
            reject(
                new AppError(errorMessage, {
                    code: US_ERRORS.ACTION_TIMEOUT,
                }),
            );
        }, timeoutMs);
    });

    return Promise.race([promise, timeoutPromise]);
};
