import {Request, Response, NextFunction} from '@gravity-ui/expresskit';
import {resolvePrivatePermissions} from '../private-permissions';
import {DL_COMPONENT_HEADER} from '../../const';

export const ctx = async (req: Request, res: Response, next: NextFunction) => {
    const {
        tenantId,
        workbookId,
        userId,
        login,
        isPrivateRoute = false,
        dlContext,
        onlyPublic,
        projectId,
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
        user,
        isPrivateRoute,
        dlContext,
        onlyPublic,
        privatePermissions,
        projectId: projectId || null,
        serviceUser,
        zitadelUserRole,
    });

    req.originalContext.log('REQUEST_START', {
        ctxTenantId: tenantId,
        ctxProjectId: projectId,
        requestedBy: user,
        dlContext,
    });

    next();
};
