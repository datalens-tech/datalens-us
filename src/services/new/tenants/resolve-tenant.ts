import {AppError} from '@gravity-ui/nodekit';

import {US_ERRORS} from '../../../const';
import {ServiceArgs} from '../types';

import {getTenantByCollectionId} from './get-tenant-by-collection-id';
import {getTenantByEntryId} from './get-tenant-by-entry-id';
import {getTenantByWorkbookId} from './get-tenant-by-workbook-id';

type ResolveTenantArgs = {
    entryId?: string;
    collectionId?: string;
    workbookId?: string;
};

export const resolveTenant = async ({ctx, trx}: ServiceArgs, args: ResolveTenantArgs) => {
    ctx.log('RESOLVE_TENANT_REQUEST');

    let tenant;
    if (args.entryId) {
        tenant = await getTenantByEntryId({ctx, trx}, {entryId: args.entryId});
    } else if (args.collectionId) {
        tenant = await getTenantByCollectionId({ctx, trx}, {collectionId: args.collectionId});
    } else if (args.workbookId) {
        tenant = await getTenantByWorkbookId({ctx, trx}, {workbookId: args.workbookId});
    }

    if (tenant === undefined) {
        throw new AppError(US_ERRORS.NOT_EXIST_ENTRY, {
            code: US_ERRORS.NOT_EXIST_ENTRY,
        });
    }

    ctx.log('RESOLVE_TENANT_SUCCESS', {tenant});

    return tenant;
};
