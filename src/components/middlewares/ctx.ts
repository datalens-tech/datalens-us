import {NextFunction, Request, Response} from '@gravity-ui/expresskit';

import {DL_COMPONENT_HEADER} from '../../const';
import {resolvePrivatePermissions} from '../private-permissions';

export const ctx = async (req: Request, res: Response, next: NextFunction) => {
    const {
        tenantId,
        workbookId,
        datasetId,
        userToken,
        userId,
        login,
        isPrivateRoute = false,
        dlContext,
        onlyPublic,
        serviceUser,
        zitadelUserRole,
    } = res.locals;

    const privatePermissions = resolvePrivatePermissions(
        req.headers[DL_COMPONENT_HEADER] as string,
    );

    const user = {userId, login};

    req.originalContext.set('info', {
        requestId: req.id,
        tenantId,
        workbookId,
        datasetId,
        userToken,
        user,
        isPrivateRoute,
        dlContext,
        onlyPublic,
        privatePermissions,
        serviceUser,
        zitadelUserRole,
    });

    req.ctx.log('REQUEST_INFO', {
        ctxTenantId: tenantId,
        requestedBy: user,
        dlContext,
    });

    next();
};
