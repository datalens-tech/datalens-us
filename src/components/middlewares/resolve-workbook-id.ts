import {NextFunction, Request, Response} from '@gravity-ui/expresskit';
import {AppError} from '@gravity-ui/nodekit';

import {Feature, isEnabledFeature} from '../../components/features';
import {DL_WORKBOOK_ID_HEADER, US_ERRORS} from '../../const';
import Utils from '../../utils';

export const resolveWorkbookId = (req: Request, res: Response, next: NextFunction) => {
    if (isEnabledFeature(req.ctx, Feature.WorkbookIsolationEnabled)) {
        try {
            res.locals.workbookId = req.headers[DL_WORKBOOK_ID_HEADER]
                ? Utils.decodeId(req.headers[DL_WORKBOOK_ID_HEADER] as string)
                : undefined;
        } catch (err) {
            req.ctx.logError('INCORRECT_WORKBOOK_ID_HEADER_ERROR', err);
            throw new AppError(US_ERRORS.INCORRECT_WORKBOOK_ID_HEADER, {
                code: US_ERRORS.INCORRECT_WORKBOOK_ID_HEADER,
            });
        }
    }

    next();
};
