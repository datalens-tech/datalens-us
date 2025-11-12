import {QueryBuilder, TransactionOrKnex, raw} from 'objection';

import {CURRENT_TIMESTAMP} from '../../../../../const';
import {LicenseLimit, LicenseLimitColumnRaw} from '../index';

export class LicenseLimitWithStartedInFuture extends LicenseLimit {
    protected static get selectedColumns() {
        return [
            '*',
            raw(`?? > ?`, [LicenseLimitColumnRaw.StartedAt, raw(CURRENT_TIMESTAMP)]).as(
                'started_in_future',
            ),
        ];
    }

    static getSelectQuery(trx: TransactionOrKnex) {
        const query = LicenseLimit.query(trx).select(this.selectedColumns);

        return query as QueryBuilder<
            LicenseLimitWithStartedInFuture,
            LicenseLimitWithStartedInFuture[]
        >;
    }

    startedInFuture!: boolean;
}
