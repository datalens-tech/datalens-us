import {QueryBuilder, TransactionOrKnex, raw} from 'objection';

import {CURRENT_TIMESTAMP} from '../../../../../const';
import {LicenseKey, LicenseKeyColumnRaw} from '../index';

export class LicenseKeyWithIsActive extends LicenseKey {
    protected static get selectedColumns() {
        return [
            '*',
            raw(`?? > ${CURRENT_TIMESTAMP} AND ?? < ${CURRENT_TIMESTAMP}`, [
                LicenseKeyColumnRaw.StartedAt,
                LicenseKeyColumnRaw.EndedAt,
            ]).as('is_active'),
        ];
    }

    static getSelectQuery(trx: TransactionOrKnex) {
        const query = LicenseKey.query(trx).select(this.selectedColumns);

        return query as QueryBuilder<LicenseKeyWithIsActive, LicenseKeyWithIsActive[]>;
    }

    isActive!: boolean;
}
