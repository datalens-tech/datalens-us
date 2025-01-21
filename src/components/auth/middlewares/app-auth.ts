import {NextFunction, Request, Response} from '@gravity-ui/expresskit';
import jwt, {type Algorithm} from 'jsonwebtoken';

import {AUTHORIZATION_HEADER, DL_AUTH_HEADER_KEY} from '../../../const/common';
import {AUTH_ERRORS} from '../constants/error-constants';
import type {AccessTokenPayload} from '../types/token';

const ALGORITHMS: Algorithm[] = ['PS256'];

export const appAuth = async (req: Request, res: Response, next: NextFunction) => {
    req.ctx.log('AUTH');

    const authorization = req.headers[AUTHORIZATION_HEADER];

    if (authorization) {
        const accessToken = authorization.slice(DL_AUTH_HEADER_KEY.length + 1);

        if (accessToken) {
            try {
                req.ctx.log('CHECK_ACCESS_TOKEN');

                const {userId, sessionId, roles} = jwt.verify(
                    accessToken,
                    req.ctx.config.authTokenPublicKey || '',
                    {
                        algorithms: ALGORITHMS,
                    },
                ) as AccessTokenPayload;

                req.originalContext.set('user', {
                    userId,
                    sessionId,
                    accessToken,
                    roles,
                });

                // for ctx info
                res.locals.userId = userId;
                res.locals.login = userId;

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
