import {NextFunction, Request, Response} from '@gravity-ui/expresskit';
import jwt from 'jsonwebtoken';

import {SYSTEM_USER, US_DYNAMIC_MASTER_TOKEN_HEADER, US_MASTER_TOKEN_HEADER} from '../../const';
import {Feature, isEnabledFeature} from '../features';

interface DynamicMasterTokenPayload {
    serviceId: string;
}

function replaceDotsInLogin(login: string) {
    let correctedLogin = login;

    if (!login.includes('@')) {
        correctedLogin = login.replace(/\./g, '-');
    }

    return correctedLogin;
}

const jwtVerify = (token: string, publicKey: string) => {
    return new Promise((resolve, reject) => {
        jwt.verify(
            token,
            publicKey,
            {
                algorithms: ['RS256'],
            },
            (err, decoded) => {
                if (err) {
                    reject(err);
                }

                resolve(decoded);
            },
        );
    });
};

export async function resolvePrivateRoute(req: Request, res: Response, next: NextFunction) {
    req.ctx.log('PRIVATE_API_CALL');

    const isDynamicMasterTokenEnabled = isEnabledFeature(
        req.ctx,
        Feature.DynamicMasterTokenEnabled,
    );

    if (isDynamicMasterTokenEnabled) {
        const dynamicMasterToken = req.headers[US_DYNAMIC_MASTER_TOKEN_HEADER] as Optional<string>;

        if (dynamicMasterToken) {
            try {
                req.ctx.log('CHECK_DYNAMIC_MASTER_TOKEN');

                // Decode token to get serviceId (without verification)
                const decoded = jwt.decode(dynamicMasterToken) as DynamicMasterTokenPayload | null;

                if (!decoded || !decoded.serviceId) {
                    req.ctx.log('DYNAMIC_MASTER_TOKEN_DECODE_FAILED');
                    res.status(403).send({error: 'Invalid dynamic master token format'});
                    return;
                }

                const serviceId = decoded.serviceId;

                if (!serviceId) {
                    req.ctx.log('DYNAMIC_MASTER_TOKEN_MISSING_SERVICE_ID');
                    res.status(403).send({error: 'Dynamic master token missing serviceId'});
                    return;
                }

                const publicKeys = req.ctx.config.dynamicMasterTokenPublicKeys?.[serviceId]?.filter(
                    (key) => key !== undefined,
                );

                if (!publicKeys || publicKeys.length === 0) {
                    req.ctx.log('DYNAMIC_MASTER_TOKEN_PUBLIC_KEY_NOT_FOUND', {serviceId});
                    res.status(403).send({
                        error: `Public key not found for serviceId: ${serviceId}`,
                    });
                    return;
                }

                try {
                    await Promise.any(publicKeys.map((key) => jwtVerify(dynamicMasterToken, key)));
                } catch (err) {
                    req.ctx.logError('DYNAMIC_MASTER_TOKEN_VERIFICATION_ERROR', err);
                    res.status(403).send({error: 'Invalid dynamic master token'});
                    return;
                }

                req.ctx.log('PRIVATE_API_CALL_AUTHORIZED', {method: 'dynamic', serviceId});

                res.locals.isPrivateRoute = true;
                next();
                return;
            } catch (err) {
                req.ctx.logError('DYNAMIC_MASTER_TOKEN_VERIFICATION_ERROR', err);
                res.status(403).send({error: 'Invalid dynamic master token'});
                return;
            }
        } else {
            const isDynamicMasterTokenRequired = isEnabledFeature(
                req.ctx,
                Feature.DynamicMasterTokenIsRequired,
            );

            if (isDynamicMasterTokenRequired) {
                req.ctx.log('DYNAMIC_MASTER_TOKEN_REQUIRED_BUT_MISSING');
                res.status(403).send({error: 'Dynamic master token is required'});
                return;
            }

            req.ctx.log('FALLBACK_TO_STATIC_MASTER_TOKEN');
        }
    }

    const masterToken = req.ctx.config.masterToken;

    if (!masterToken || masterToken.length === 0) {
        res.status(403).send({error: 'No master token in config'});
        return;
    }

    const requestMasterToken = req.headers[US_MASTER_TOKEN_HEADER] as Optional<string>;

    if (!requestMasterToken || !masterToken.includes(requestMasterToken)) {
        req.ctx.log('PRIVATE_API_CALL_DENIED');

        res.status(403).send({error: 'Private API call denied'});
        return;
    }

    req.ctx.log('PRIVATE_API_CALL_AUTHORIZED', {method: 'static'});

    res.locals.isPrivateRoute = true;
    next();
}

export const resolveSpecialTokens = async (req: Request, res: Response, next: NextFunction) => {
    res.locals.userId = res.locals.userId || SYSTEM_USER.ID;
    res.locals.login = replaceDotsInLogin(res.locals.login || 'unknown');

    if (req.routeInfo.private) {
        resolvePrivateRoute(req, res, next);
    } else {
        next();
    }
};
