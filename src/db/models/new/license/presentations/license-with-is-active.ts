import {QueryBuilder, TransactionOrKnex, raw} from 'objection';

import {CURRENT_TIMESTAMP} from '../../../../../const';
import {License, LicenseColumn} from '../index';

export class LicenseWithIsActive extends License {
    static get selectedColumns() {
        return [
            '*',
            raw(`?? > ? OR ?? IS NULL`, [
                LicenseColumn.ExpiresAt,
                raw(CURRENT_TIMESTAMP),
                LicenseColumn.ExpiresAt,
            ]).as('is_active'),
        ];
    }

    static getSelectQuery(trx: TransactionOrKnex) {
        const query = License.query(trx).select(this.selectedColumns);

        return query as QueryBuilder<LicenseWithIsActive, LicenseWithIsActive[]>;
    }

    isActive!: boolean;
}
