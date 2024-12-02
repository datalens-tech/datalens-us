import {NextFunction, Request, Response} from '@gravity-ui/expresskit';

export const resolveTenantId = async (req: Request, res: Response, next: NextFunction) => {
    const {tenantIdOverride} = req.ctx.config;
    res.locals.tenantId = tenantIdOverride;
    next();
};
