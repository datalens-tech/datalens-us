import moment from 'moment';
import {TransactionOrKnex} from 'objection';

import {Lock, LockColumn} from '../../../../db/models/new/lock';
import {getPrimary} from '../../utils';

export const pullActiveLock = ({entryId, trx}: {entryId: string; trx?: TransactionOrKnex}) => {
    const currentDate = moment().format();

    return Lock.query(getPrimary(trx))
        .select()
        .where(LockColumn.EntryId, entryId)
        .where(LockColumn.ExpiryDate, '>', currentDate)
        .first()
        .timeout(Lock.DEFAULT_QUERY_TIMEOUT);
};
