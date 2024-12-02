import type {WorkbookInstance} from '../../../../registry/common/entities/workbook/types';

import {formatWorkbook} from './format-workbook';

export const formatWorkbooksList = ({
    workbooks,
    nextPageToken,
}: {
    workbooks: WorkbookInstance[];
    nextPageToken?: string;
}) => {
    return {
        workbooks: workbooks.map(formatWorkbook),
        nextPageToken,
    };
};
