import {Request, Response, NextFunction} from '@gravity-ui/expresskit';

jest.mock('../../../components/middlewares/auth-zitadel', () => {
    const originalModule = jest.requireActual('../../../components/middlewares/auth-zitadel');

    return {
        ...originalModule,

        authZitadel: jest.fn((req: Request, res: Response, next: NextFunction) => {
            const {ZITADEL_USER_ROLE_HEADER} = require('../constants');
            const {ZitadelUserRole} = require('../../../types/zitadel');
            const role = req.headers[ZITADEL_USER_ROLE_HEADER];
            res.locals.zitadelUserRole = role ?? ZitadelUserRole.Viewer;
            return next();
        }),
    };
});
