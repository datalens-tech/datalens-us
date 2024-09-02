import {ServiceArgs} from '../types';
import {AppError} from '@gravity-ui/nodekit';
import {logInfo} from '../../../utils';
import {makeSchemaValidator} from '../../../components/validation-schema-compiler';
import {Tenant, TenantColumn} from '../../../db/models/new/tenant';
import {WorkbookModel, WorkbookModelColumn} from '../../../db/models/new/workbook';

const validateArgs = makeSchemaValidator({
    type: 'object',
    required: ['workbookId'],
    properties: {
        workbookId: {
            type: 'string',
        },
    },
});

interface GetTenantByWORKBOOKIdArgs {
    workbookId: string;
}

export const getTenantByWorkbookId = async (
    {ctx, trx}: ServiceArgs,
    args: GetTenantByWORKBOOKIdArgs,
    skipValidation = false,
) => {
    const targetTrx = trx ?? Tenant.replica;

    const {workbookId} = args;

    const {tenantId} = ctx.get('info');

    logInfo(ctx, 'GET_TENANT_BY_WORKBOOK_ID', {tenantId, workbookId});

    if (!skipValidation) {
        validateArgs(args);
    }

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
        throw new AppError('NOT_EXISTS_TENANT_BY_WORKBOOK_ID', {
            code: 'NOT_EXISTS_TENANT_BY_WORKBOOK_ID',
        });
    }

    logInfo(ctx, 'GET_TENANT_BY_WORKBOOK_ID_SUCCESS');

    return tenant;
};
