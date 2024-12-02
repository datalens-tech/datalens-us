import {NextFunction, Request, Response} from '@gravity-ui/expresskit';

import {US_ERRORS} from '../../const';
import {Feature, isEnabledFeature} from '../features';

export const checkReadOnlyMode = (req: Request, res: Response, next: NextFunction) => {
    const readOnlyMode = isEnabledFeature(req.ctx, Feature.ReadOnlyMode);

    if (readOnlyMode && req.routeInfo.write) {
        req.ctx.logError(US_ERRORS.READ_ONLY_MODE_ENABLED);
        res.status(451).send({code: US_ERRORS.READ_ONLY_MODE_ENABLED});
        return;
    }

    next();
};
