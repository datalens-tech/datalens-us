import type {Request, Response, NextFunction} from '@gravity-ui/expresskit';
import type {AuthArgs as OpensourceAuth} from '../env/opensource/auth';
import type {AuthArgs as PlatformAuth} from '../env/platform/auth';

jest.mock('../../../components/middlewares/auth-zitadel', () => {
    const originalModule = jest.requireActual('../../../components/middlewares/auth-zitadel');

    return {
        ...originalModule,

        authZitadel: jest.fn((req: Request, res: Response, next: NextFunction) => {
            try {
                const token: Nullable<string> = originalModule.extractAuthTokenFromHeader(
                    req.headers,
                );

                if (!token) {
                    throw new Error('Empty token');
                }

                const user = JSON.parse(token) as OpensourceAuth | PlatformAuth;

                res.locals.userToken = token;
                res.locals.userId = user.userId;
                res.locals.login = user.login;
                res.locals.zitadelUserRole = user.role;

                return next();
            } catch (error) {
                return res.status(401).send({error: 'Unauthenticated'});
            }
        }),
    };
});
