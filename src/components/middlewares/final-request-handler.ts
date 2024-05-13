import {Request, Response} from '@gravity-ui/expresskit';
import {AppError} from '@gravity-ui/nodekit';
import prepareErrorResponse from '../error-response-presenter';

export function logError(error: AppError, req: Request) {
    if (error instanceof AppError) {
        const {message} = error;
        req.ctx.log(message, {error});
    } else {
        req.ctx.logError('Unhandled US error', error);
    }
}

export const finalRequestHandler = async (error: AppError, req: Request, res: Response) => {
    logError(error, req);
    const {code, response} = prepareErrorResponse(error);
    res.status(code).send(response);
};
