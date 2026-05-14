import {zc} from '../../../components/zod';
import {DEFAULT_PAGE_SIZE, OrderBy} from '../../../const';
import {WorkbookModel, WorkbookModelColumn} from '../../../db/models/new/workbook';
import {createPaginator} from '../../../utils/cursor-pagination';
import {ServiceArgs} from '../types';
import {getReplica} from '../utils';

export interface GetAllWorkbooksArgs {
    page?: string;
    pageSize?: number;
}

export const getAllWorkbooks = async ({ctx}: ServiceArgs, args: GetAllWorkbooksArgs) => {
    const {page, pageSize = DEFAULT_PAGE_SIZE} = args;

    ctx.log('GET_ALL_WORKBOOKS_START', {
        page,
        pageSize,
    });

    const paginator = createPaginator({
        sortFields: [
            {
                field: `${WorkbookModel.tableName}.${WorkbookModelColumn.CreatedAt}`,
                direction: OrderBy.Asc,
                validate: zc.stringSqlTimestampz(),
            },
        ],
        tiebreakerField: {
            field: `${WorkbookModel.tableName}.${WorkbookModelColumn.WorkbookId}`,
            direction: OrderBy.Asc,
            validate: zc.stringBigInt(),
        },
        limit: pageSize,
        pageToken: page,
    });

    const query = WorkbookModel.query(getReplica())
        .select('*')
        .where({[WorkbookModelColumn.DeletedAt]: null})
        .timeout(WorkbookModel.DEFAULT_QUERY_TIMEOUT);

    const {result: workbooks, nextPageToken} = await paginator.execute(query);

    ctx.log('GET_ALL_WORKBOOKS_FINISH', {
        workbooksCount: workbooks.length,
        nextPageToken,
    });

    return {
        workbooks,
        nextPageToken,
    };
};
