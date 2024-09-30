import type {Request, Response, NextFunction} from '@gravity-ui/expresskit';
import type {AuthArgs} from '../auth';

jest.mock('../../../components/middlewares/auth-zitadel', () => {
    const originalModule = jest.requireActual('../../../components/middlewares/auth-zitadel');

    const getUserFromToken = (token: string): AuthArgs => {
        return JSON.parse(token);
    };

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

                const user = getUserFromToken(token);

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
