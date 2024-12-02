import {AppError} from '@gravity-ui/nodekit';
import {TransactionOrKnex} from 'objection';

import {makeSchemaValidator} from '../../../../components/validation-schema-compiler';
import {US_ERRORS} from '../../../../const';
import {Entry} from '../../../../db/models/new/entry';
import {CTX} from '../../../../types/models';
import {getWorkbook} from '../../../new/workbook/get-workbook';

const validateVerifiableEntry = makeSchemaValidator({
    type: 'object',
    required: ['entryId', 'workbookId', 'tenantId'],
    properties: {
        entryId: {
            type: 'string',
        },
        workbookId: {
            type: ['string', 'null'],
        },
        tenantId: {
            type: 'string',
        },
    },
});

type VerifiableEntry = Pick<Entry, 'entryId' | 'workbookId' | 'tenantId'>;

export const checkFetchedEntry = async (
    ctx: CTX,
    entry: VerifiableEntry,
    trx: TransactionOrKnex,
) => {
    ctx.log('CHECK_FETCHED_ENTRY_INIT');

    ctx.log('VALIDATE_VERIFABLE_ENTRY');

    validateVerifiableEntry({
        entryId: entry.entryId,
        workbookId: entry.workbookId,
        tenantId: entry.tenantId,
    });

    const {workbookId} = entry;

    if (workbookId) {
        await getWorkbook(
            {ctx, trx, skipValidation: true, skipCheckPermissions: true},
            {workbookId},
        );
    } else {
        ctx.log('CHECK_TENANT_ID_INIT');

        const {tenantId} = ctx.get('info');

        const entryTenantId = entry.tenantId;

        if (entryTenantId !== tenantId) {
            throw new AppError(US_ERRORS.NOT_MATCH_TOGETHER, {
                code: US_ERRORS.NOT_MATCH_TOGETHER,
            });
        }
        ctx.log('CHECK_TENANT_ID_SUCCESS');
    }

    ctx.log('CHECK_ENTRY_SUCCESS');
};
