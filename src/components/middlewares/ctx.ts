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

    req.originalContext.set('info', {
        requestId: req.id,
        tenantId,
        workbookId,
        user: {userId, login},
        isPrivateRoute,
        dlContext,
        onlyPublic,
        privatePermissions,
        projectId: projectId || null,
        serviceUser,
        zitadelUserRole,
    });

    next();
};
