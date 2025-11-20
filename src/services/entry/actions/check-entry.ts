import {AppError} from '@gravity-ui/nodekit';
import {TransactionOrKnex} from 'objection';

import {makeSchemaValidator} from '../../../components/validation-schema-compiler';
import {DEFAULT_QUERY_TIMEOUT, US_ERRORS} from '../../../const';
import Entry from '../../../db/models/entry';
import {CTX, EntryColumns} from '../../../types/models';
import {getWorkbook} from '../../new/workbook/get-workbook';

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

type VerifiableEntry = Pick<EntryColumns, 'entryId' | 'workbookId' | 'tenantId'>;

type CheckEntryData = {verifiableEntry: VerifiableEntry} | {entryId: string};

export async function checkEntry(ctx: CTX, trx: TransactionOrKnex, data: CheckEntryData) {
    ctx.log('CHECK_ENTRY_INIT');

    let entry: VerifiableEntry | Entry | undefined;

    if ('verifiableEntry' in data) {
        entry = data.verifiableEntry;

        ctx.log('VALIDATE_VERIFABLE_ENTRY');
        validateVerifiableEntry({
            entryId: entry.entryId,
            workbookId: entry.workbookId,
            tenantId: entry.tenantId,
        });
    } else {
        entry = await Entry.query(trx)
            .select()
            .where({entryId: data.entryId})
            .first()
            .timeout(DEFAULT_QUERY_TIMEOUT);
    }

    if (!entry) {
        throw new AppError(US_ERRORS.NOT_EXIST_ENTRY, {
            code: US_ERRORS.NOT_EXIST_ENTRY,
        });
    }

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
}
