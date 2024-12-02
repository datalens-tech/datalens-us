import {WorkbookModel} from '../../../../db/models/new/workbook';

import {formatWorkbookModel} from './format-workbook-model';

export const formatWorkbookModelsList = ({
    workbooks,
    nextPageToken,
}: {
    workbooks: WorkbookModel[];
    nextPageToken?: string;
}) => {
    return {
        workbooks: workbooks.map(formatWorkbookModel),
        nextPageToken,
    };
};
