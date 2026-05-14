import {NextFunction, Request, Response} from '@gravity-ui/expresskit';
import jwt, {type Algorithm} from 'jsonwebtoken';

import {AUTHORIZATION_HEADER, DL_AUTH_HEADER_KEY} from '../../../const/common';
import {AUTH_ERRORS} from '../constants/error-constants';
import {ACCESS_TOKEN_TYPE} from '../constants/token';
import type {SubjectAccessTokenPayload} from '../types/token';

const ALGORITHMS: Algorithm[] = ['PS256'];

export const appAuth = async (req: Request, res: Response, next: NextFunction) => {
    req.ctx.log('AUTH');

    const authorization = req.headers[AUTHORIZATION_HEADER];

    if (authorization) {
        const accessToken = authorization.slice(DL_AUTH_HEADER_KEY.length + 1);

        if (accessToken) {
            try {
                req.ctx.log('CHECK_ACCESS_TOKEN');

                const payload = jwt.verify(accessToken, req.ctx.config.authTokenPublicKey || '', {
                    algorithms: ALGORITHMS,
                }) as SubjectAccessTokenPayload;

                if (payload.type === ACCESS_TOKEN_TYPE.SERVICE_ACCOUNT) {
                    req.originalContext.set('user', {
                        userId: payload.userId,
                        accessToken,
                        roles: payload.roles,
                        type: ACCESS_TOKEN_TYPE.SERVICE_ACCOUNT,
                    });
                } else {
                    req.originalContext.set('user', {
                        userId: payload.userId,
                        sessionId: payload.sessionId,
                        accessToken,
                        roles: payload.roles,
                        type: ACCESS_TOKEN_TYPE.USER,
                    });
                }

                // for ctx info
                res.locals.userId = payload.userId;
                res.locals.login = payload.userId;

                req.ctx.log('CHECK_ACCESS_TOKEN_SUCCESS');

                next();
                return;
            } catch (err) {
                req.ctx.logError('CHECK_ACCESS_TOKEN_ERROR', err);
            }
        }
    }

    res.status(401).send({code: AUTH_ERRORS.UNAUTHORIZED_ACCESS, message: 'Unauthorized access'});
};
