import {DEFAULT_PAGE, DEFAULT_PAGE_SIZE} from '../../../const';
import {WorkbookModel, WorkbookModelColumn} from '../../../db/models/new/workbook';
import Utils from '../../../utils';
import {ServiceArgs} from '../types';
import {getReplica} from '../utils';

export interface GetAllWorkbooksArgs {
    page?: number;
    pageSize?: number;
}

export const getAllWorkbooks = async ({ctx}: ServiceArgs, args: GetAllWorkbooksArgs) => {
    const {page = DEFAULT_PAGE, pageSize = DEFAULT_PAGE_SIZE} = args;

    ctx.log('GET_ALL_WORKBOOKS_START', {
        page,
        pageSize,
    });

    const workbooksPage = await WorkbookModel.query(getReplica())
        .select()
        .where({
            [WorkbookModelColumn.DeletedAt]: null,
        })
        .limit(pageSize)
        .offset(pageSize * page)
        .timeout(WorkbookModel.DEFAULT_QUERY_TIMEOUT);

    const nextPageToken = Utils.getOptimisticNextPageToken({
        page,
        pageSize,
        curPage: workbooksPage,
    });

    ctx.log('GET_ALL_WORKBOOKS_FINISH', {
        workbooksCount: workbooksPage.length,
        nextPageToken,
    });

    return {
        workbooks: workbooksPage,
        nextPageToken,
    };
};
