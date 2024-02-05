import {Request, Response, NextFunction} from '@gravity-ui/expresskit';
import {isAuthFeature} from '../features';


export const rpcAuthorization = (req: Request, res: Response, next: NextFunction) => {
    isAuthFeature(req, res, (status: number, responseData: any) => {
        if (status == 200) {
            var r:any = req;
            r.rpc = responseData;

            next();
        } else {
            req.ctx.logError('NOT_RPC_AUTHORIZATION');
            res.status(401).send({code: 'NOT_RPC_AUTHORIZATION'});
        }
    });
};
