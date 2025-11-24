import {QueryBuilder, TransactionOrKnex, raw} from 'objection';

import {CURRENT_TIMESTAMP} from '../../../../../const';
import {LicenseLimit, LicenseLimitColumnRaw} from '../index';

export class LicenseLimitWithIsStartedOnCurrentDay extends LicenseLimit {
    static get selectedColumns() {
        return [
            '*',
            raw(
                `DATE_TRUNC('day', ?? AT TIME ZONE 'Europe/Moscow') = DATE_TRUNC('day', ? AT TIME ZONE 'Europe/Moscow')`,
                [LicenseLimitColumnRaw.StartedAt, raw(CURRENT_TIMESTAMP)],
            ).as('is_started_on_current_day'),
        ];
    }

    static getSelectQuery(trx: TransactionOrKnex) {
        const query = LicenseLimit.query(trx).select(this.selectedColumns);

        return query as QueryBuilder<
            LicenseLimitWithIsStartedOnCurrentDay,
            LicenseLimitWithIsStartedOnCurrentDay[]
        >;
    }

    isStartedOnCurrentDay!: boolean;
}
