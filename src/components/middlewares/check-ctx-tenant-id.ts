import {NextFunction, Request, Response} from '@gravity-ui/expresskit';
import {AppError} from '@gravity-ui/nodekit';

import {US_ERRORS} from '../../const';

export const checkCtxTenantId = (req: Request, res: Response, next: NextFunction) => {
    if (req.routeInfo.requireCtxTenantId) {
        const {tenantId} = req.ctx.get('info');

        if (!tenantId) {
            throw new AppError(US_ERRORS.TENANT_ID_MISSING_IN_CONTEXT, {
                code: US_ERRORS.TENANT_ID_MISSING_IN_CONTEXT,
            });
        }
    }

    next();
};
