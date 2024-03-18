import {AppError} from '@gravity-ui/nodekit';
import {US_ERRORS} from '../../../../const';
import {CTX} from '../../../../types/models';

export const checkWorkbookIsolation = ({
    ctx,
    workbookId: entryWorkbookId,
}: {
    ctx: CTX;
    workbookId: string | null;
}) => {
    const {workbookId: requestWorkbookId} = ctx.get('info');

    if (requestWorkbookId && requestWorkbookId !== entryWorkbookId) {
        throw new AppError(US_ERRORS.WORKBOOK_ISOLATION_INTERRUPTION, {
            code: US_ERRORS.WORKBOOK_ISOLATION_INTERRUPTION,
        });
    }
};
