import {AppError} from '@gravity-ui/nodekit';
import {TransactionOrKnex} from 'objection';

import {DEFAULT_QUERY_TIMEOUT, US_ERRORS} from '../../../../const';
import {Entry} from '../../../../db/models/new/entry';
import {CTX} from '../../../../types/models';

import {checkFetchedEntry} from './check-fetched-entry';

export const checkEntry = async (ctx: CTX, entryId: string, trx: TransactionOrKnex) => {
    ctx.log('CHECK_ENTRY_INIT');

    const entry = await Entry.query(trx).findById(entryId).first().timeout(DEFAULT_QUERY_TIMEOUT);

    if (!entry) {
        throw new AppError(US_ERRORS.NOT_EXIST_ENTRY, {
            code: US_ERRORS.NOT_EXIST_ENTRY,
        });
    }

    await checkFetchedEntry(
        ctx,
        {
            entryId: entry.entryId,
            workbookId: entry.workbookId,
            tenantId: entry.tenantId,
        },
        trx,
    );
};
