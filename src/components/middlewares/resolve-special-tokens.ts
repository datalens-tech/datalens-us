import {NextFunction, Request, Response} from '@gravity-ui/expresskit';

import {SYSTEM_USER, US_MASTER_TOKEN_HEADER} from '../../const';

function replaceDotsInLogin(login: string) {
    let correctedLogin = login;

    if (!login.includes('@')) {
        correctedLogin = login.replace(/\./g, '-');
    }

    return correctedLogin;
}

function resolvePrivateRoute(req: Request, res: Response, next: NextFunction) {
    req.ctx.log('PRIVATE_API_CALL');

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

    req.ctx.log('PRIVATE_API_CALL_AUTHORIZED');

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
