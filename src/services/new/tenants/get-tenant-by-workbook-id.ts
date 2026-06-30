import {NotExistEntryError} from '../../../components/errors';
import {Tenant, TenantColumn} from '../../../db/models/new/tenant';
import {WorkbookModel, WorkbookModelColumn} from '../../../db/models/new/workbook';
import {ServiceArgs} from '../types';
import {getReplica} from '../utils';

interface GetTenantByWorkbookIdArgs {
    workbookId: string;
}

export const getTenantByWorkbookId = async (
    {ctx, trx}: ServiceArgs,
    args: GetTenantByWorkbookIdArgs,
) => {
    const targetTrx = getReplica(trx);

    const {workbookId} = args;

    const {tenantId} = ctx.get('info');

    ctx.log('GET_TENANT_BY_WORKBOOK_ID', {tenantId, workbookId});

    const tenant = await Tenant.query(targetTrx)
        .select(`${Tenant.tableName}.*`)
        .join(
            WorkbookModel.tableName,
            `${WorkbookModel.tableName}.${WorkbookModelColumn.TenantId}`,
            `${Tenant.tableName}.${TenantColumn.TenantId}`,
        )
        .where({
            [`${WorkbookModel.tableName}.${WorkbookModelColumn.WorkbookId}`]: workbookId,
        })
        .first()
        .timeout(Tenant.DEFAULT_QUERY_TIMEOUT);

    if (!tenant) {
        throw new NotExistEntryError();
    }

    ctx.log('GET_TENANT_BY_WORKBOOK_ID_SUCCESS');

    return tenant;
};
