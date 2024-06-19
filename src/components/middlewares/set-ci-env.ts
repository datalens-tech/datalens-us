import {Request, Response, NextFunction} from '@gravity-ui/expresskit';

export const setCiEnv = (req: Request, res: Response, next: NextFunction) => {
    res.locals.userId = 'dev-user-id';
    res.locals.login = 'dev-user-login';

    next();
};
