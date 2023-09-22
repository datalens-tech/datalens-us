import request from 'supertest';
import {TEST_USER_ID_HEADER, TEST_USER_LOGIN_HEADER} from './constants';

export const withScopeHeaders = (req: request.Test) => {
    return req;
};

type WithOverridedUserHeadersOptions = {
    userLogin: string;
    userId: string;
};

export const withOverridedUserHeaders = (
    req: request.Test,
    opt: WithOverridedUserHeadersOptions,
) => {
    req.set(TEST_USER_ID_HEADER, opt.userId);
    req.set(TEST_USER_LOGIN_HEADER, opt.userLogin);
    return req;
};
