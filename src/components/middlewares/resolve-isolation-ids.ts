import {NextFunction, Request, Response} from '@gravity-ui/expresskit';
import {AppContext, AppError} from '@gravity-ui/nodekit';

import {Feature, isEnabledFeature} from '../../components/features';
import {DL_DATASET_ID_HEADER, DL_WORKBOOK_ID_HEADER, US_ERRORS} from '../../const';
import Utils from '../../utils';

const decodeIdFromHeader = (ctx: AppContext, header: string | undefined, errorMessage: string) => {
    if (!header) return undefined;
    try {
        return Utils.decodeId(header);
    } catch (err) {
        ctx.logError(errorMessage, err);
        throw new AppError(errorMessage, {code: errorMessage});
    }
};

export const resolveIsolationIds = (req: Request, res: Response, next: NextFunction) => {
    if (isEnabledFeature(req.ctx, Feature.WorkbookIsolationEnabled)) {
        res.locals.workbookId = decodeIdFromHeader(
            req.ctx,
            req.headers[DL_WORKBOOK_ID_HEADER] as string | undefined,
            US_ERRORS.INCORRECT_WORKBOOK_ID_HEADER,
        );

        res.locals.datasetId = decodeIdFromHeader(
            req.ctx,
            req.headers[DL_DATASET_ID_HEADER] as string | undefined,
            US_ERRORS.INCORRECT_DATASET_ID_HEADER,
        );
    }

    next();
};
