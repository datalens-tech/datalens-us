import {QueryBuilder, TransactionOrKnex, raw} from 'objection';

import {CURRENT_TIMESTAMP} from '../../../../../const';
import {LicenseAssignment, LicenseAssignmentColumnRaw} from '../index';

export class LicenseAssignmentWithIsActive extends LicenseAssignment {
    protected static get selectedColumns() {
        return [
            '*',
            raw(`?? > ${CURRENT_TIMESTAMP} OR ?? IS NULL`, [
                LicenseAssignmentColumnRaw.ExpiresAt,
                LicenseAssignmentColumnRaw.ExpiresAt,
            ]).as('is_active'),
        ];
    }

    static getSelectQuery(trx: TransactionOrKnex) {
        const query = LicenseAssignment.query(trx).select(this.selectedColumns);

        return query as QueryBuilder<
            LicenseAssignmentWithIsActive,
            LicenseAssignmentWithIsActive[]
        >;
    }

    isActive!: boolean;
}
