import {NextFunction, Request, Response} from '@gravity-ui/expresskit';
import {introspect} from '../utils/zitadel';
import {IncomingHttpHeaders} from 'http';
import {DL_AUTH_HEADER_KEY, DL_SERVICE_USER_TOKEN} from '../const';
import {ZitadelServiceUser} from '../types/zitadel';

export default async function (req: Request, res: Response, next: NextFunction) {
    const {ctx} = req;

    const authToken = extractAuthTokenFromHeader(req.headers);
    const serviceUserToken = req.headers[DL_SERVICE_USER_TOKEN] as Optional<string>;

    if (authToken && serviceUserToken) {
        const [r1, r2] = await Promise.all([
            introspect(ctx, authToken),
            introspect(ctx, serviceUserToken),
        ]);

        ctx.log(`Tokens introspected successfully`);

        if (
            r1.active &&
            r2.active &&
            (r2.name === ZitadelServiceUser.charts || r2.name === ZitadelServiceUser.bi)
        ) {
            return next();
        }
    }

    return res.status(401).send('Unauthorized access');
}

export function extractAuthTokenFromHeader(headers: IncomingHttpHeaders) {
    const authHeaderParts = headers?.authorization?.split(' ');
    if (
        authHeaderParts &&
        authHeaderParts.length === 2 &&
        authHeaderParts[0].toLowerCase() === DL_AUTH_HEADER_KEY
    ) {
        return authHeaderParts[1];
    }

    return null;
}
