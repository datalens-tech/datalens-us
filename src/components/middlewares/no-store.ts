import {NextFunction, Request, Response} from '@gravity-ui/expresskit';

export const noStore = (_req: Request, res: Response, next: NextFunction) => {
    res.setHeader('Surrogate-Control', 'no-store');
    res.setHeader('Cache-Control', 'no-store, max-age=0, must-revalidate, proxy-revalidate');
    next();
};
