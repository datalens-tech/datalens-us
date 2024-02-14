import {Request, Response, NextFunction} from '@gravity-ui/expresskit';
import {
    testUserId,
    testUserLogin,
    TEST_USER_ID_HEADER,
    TEST_USER_LOGIN_HEADER,
} from '../../tests/int/constants';

export const setCiEnv = (req: Request, res: Response, next: NextFunction) => {
    res.locals.userId = req.headers[TEST_USER_ID_HEADER] ?? testUserId;
    res.locals.login = req.headers[TEST_USER_LOGIN_HEADER] ?? testUserLogin;

    next();
};
