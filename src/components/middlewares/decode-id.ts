import {NextFunction, Request, Response} from '@gravity-ui/expresskit';
import {AppError} from '@gravity-ui/nodekit';

import US_ERRORS from '../../const/us-error-constants';
import Utils from '../../utils';

export const decodeId = async (req: Request, _res: Response, next: NextFunction) => {
    if (req.routeInfo.manualDecodeId) {
        return next();
    }

    try {
        for (const idVariable of Utils.idVariables) {
            if (req.params && req.params[idVariable]) {
                const encodedId = req.params[idVariable];
                req.params[idVariable] = Utils.decodeId(encodedId);
            }

            if (req.query && req.query[idVariable]) {
                const entity = req.query[idVariable] as string | string[];

                if (Array.isArray(entity)) {
                    req.query[idVariable] = await Utils.macrotasksMap(entity, (encodedId) =>
                        Utils.decodeId(encodedId),
                    );
                } else {
                    const encodedId = entity;
                    req.query[idVariable] = Utils.decodeId(encodedId);
                }
            }

            if (req.body && req.body[idVariable]) {
                const entity = req.body[idVariable] as string | string[];

                if (Array.isArray(entity)) {
                    req.body[idVariable] = await Utils.macrotasksMap(entity, (encodedId) =>
                        Utils.decodeId(encodedId),
                    );
                } else {
                    const encodedId = req.body[idVariable];
                    req.body[idVariable] = Utils.decodeId(encodedId);
                }
            }
        }
    } catch {
        const errorMsg =
            'Some of the Ids do not have a correct format — an id should be in the lower case and consist of 13 symbols';
        throw new AppError(errorMsg, {
            code: US_ERRORS.DECODE_ID_FAILED,
        });
    }

    return next();
};
