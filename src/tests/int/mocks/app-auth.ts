import type {NextFunction, Request, Response} from '@gravity-ui/expresskit';

import type {AuthToken as OpensourceAuthToken} from '../env/opensource/auth';
import type {AuthToken as PlatformAuthToken} from '../env/platform/auth';

jest.mock('../../../components/auth/middlewares/app-auth', () => {
    const {AUTH_ERRORS} = require('../../../components/auth/constants/error-constants');

    return {
        appAuth: jest.fn((req: Request, res: Response, next: NextFunction) => {
            try {
                const authorization = req.headers.authorization;

                if (!authorization) {
                    throw new Error('Empty authorization header');
                }

                const tokenPart = authorization.split(' ')[1];

                if (!tokenPart) {
                    throw new Error('Empty token');
                }

                const user = JSON.parse(tokenPart) as OpensourceAuthToken | PlatformAuthToken;

                req.originalContext.set('user', {
                    userId: user.userId as string,
                    sessionId: 'test-session-id',
                    accessToken: tokenPart,
                    roles: user.roles,
                });

                res.locals.userId = user.userId;
                res.locals.login = user.login;

                return next();
            } catch {
                return res
                    .status(401)
                    .send({code: AUTH_ERRORS.UNAUTHORIZED_ACCESS, message: 'Unauthorized access'});
            }
        }),
    };
});
