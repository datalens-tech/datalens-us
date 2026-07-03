import {NextFunction, Request, Response} from '@gravity-ui/expresskit';
import {AppContext} from '@gravity-ui/nodekit';

import {
    IncorrectDatasetIdHeaderError,
    IncorrectWorkbookIdHeaderError,
    PresentableError,
} from '../../components/errors';
import {Feature, isEnabledFeature} from '../../components/features';
import {DL_DATASET_ID_HEADER, DL_WORKBOOK_ID_HEADER} from '../../const';
import Utils from '../../utils';

const decodeIdFromHeader = (
    ctx: AppContext,
    header: string | undefined,
    ErrorClass: new () => PresentableError,
) => {
    if (!header) return undefined;
    try {
        return Utils.decodeId(header);
    } catch (err) {
        ctx.logError(ErrorClass.name, err);
        throw new ErrorClass();
    }
};

export const resolveIsolationIds = (req: Request, res: Response, next: NextFunction) => {
    if (isEnabledFeature(req.ctx, Feature.WorkbookIsolationEnabled)) {
        res.locals.workbookId = decodeIdFromHeader(
            req.ctx,
            req.headers[DL_WORKBOOK_ID_HEADER] as string | undefined,
            IncorrectWorkbookIdHeaderError,
        );

        res.locals.datasetId = decodeIdFromHeader(
            req.ctx,
            req.headers[DL_DATASET_ID_HEADER] as string | undefined,
            IncorrectDatasetIdHeaderError,
        );
    }

    next();
};
