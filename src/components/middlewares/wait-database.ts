import {NextFunction, Request, Response} from '@gravity-ui/expresskit';

import {db} from '../../db';

export const waitDatabase = async (_req: Request, _res: Response, next: NextFunction) => {
    await db.ready();
    next();
    // TODO: In case of a DB crash requests should be restarted. (i.e. inited() and not ready())
};
