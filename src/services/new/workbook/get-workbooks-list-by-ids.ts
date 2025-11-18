import {WorkbookModel, WorkbookModelColumn} from '../../../db/models/new/workbook';
import {WorkbookPermission} from '../../../entities/workbook';
import Utils from '../../../utils';
import {makeWorkbooksWithParentsMap} from '../collection/utils';
import {ServiceArgs} from '../types';
import {getReplica} from '../utils';

type GetWorkbooksListAndAllParentsArgs = {
    workbookIds: string[];
    includePermissionsInfo?: boolean;
};

export const getWorkbooksListByIds = async (
    {ctx, trx, skipLicenseCheck, skipCheckPermissions = false}: ServiceArgs,
    args: GetWorkbooksListAndAllParentsArgs,
) => {
    const {workbookIds, includePermissionsInfo = false} = args;

    ctx.log('GET_WORKBOOKS_LIST_BY_IDS_STARTED', {
        workbookIds: await Utils.macrotasksMap(workbookIds, (id) => Utils.encodeId(id)),
        includePermissionsInfo,
    });

    const {tenantId, isPrivateRoute} = ctx.get('info');
    const registry = ctx.get('registry');

    const {fetchAndValidateLicenseOrFail} = registry.common.functions.get();

    if (!isPrivateRoute && !skipLicenseCheck) {
        await fetchAndValidateLicenseOrFail({ctx});
    }

    const targetTrx = getReplica(trx);

    const workbookList = await WorkbookModel.query(targetTrx)
        .where({
            [WorkbookModelColumn.DeletedAt]: null,
            [WorkbookModelColumn.TenantId]: tenantId,
        })
        .whereIn([WorkbookModelColumn.WorkbookId], workbookIds)
        .timeout(WorkbookModel.DEFAULT_QUERY_TIMEOUT);

    const {accessServiceEnabled} = ctx.config;

    const {Workbook} = registry.common.classes.get();

    if (!accessServiceEnabled || skipCheckPermissions || isPrivateRoute) {
        if (includePermissionsInfo) {
            return workbookList.map((model) => {
                const workbook = new Workbook({ctx, model});
                workbook.enableAllPermissions();
                return workbook;
            });
        }

        return workbookList.map((model) => new Workbook({ctx, model}));
    }

    const workbooksWithParentsMap = await makeWorkbooksWithParentsMap(
        {ctx, trx},
        {models: workbookList},
    );

    const workbooksForBulk: {model: WorkbookModel; parentIds: string[]}[] = [];

    workbooksWithParentsMap.forEach((parentIds, workbook) => {
        workbooksForBulk.push({model: workbook.model, parentIds});
    });

    let workbooks = await Workbook.bulkFetchAllPermissions(ctx, workbooksForBulk);

    workbooks = workbooks.filter(
        (workbook) => workbook.permissions?.[WorkbookPermission.LimitedView] === true,
    );

    if (!includePermissionsInfo) {
        workbooks = workbooks.map((workbook) => {
            return new Workbook({ctx, model: workbook.model});
        });
    }

    ctx.log('GET_WORKBOOKS_LIST_BY_IDS_FINISHED', {
        workbookIds: await Utils.macrotasksMap(workbookList, (workbook) =>
            Utils.encodeId(workbook.workbookId),
        ),
    });

    return workbooks;
};
