import {QueryBuilder, TransactionOrKnex, raw} from 'objection';

import {CURRENT_TIMESTAMP} from '../../../../../const';
import {LicenseQuarantine, LicenseQuarantineColumn} from '../../license-quarantine';
import {License, LicenseColumn} from '../index';

export class LicenseWithIsActive extends License {
    static get isActiveSelectColumn() {
        return raw(`?? > ? OR ?? IS NULL`, [
            LicenseColumn.ExpiresAt,
            raw(CURRENT_TIMESTAMP),
            LicenseColumn.ExpiresAt,
        ]).as('is_active');
    }

    static get quarantineEndsAtSelectColumn() {
        return raw(`(SELECT lq.?? FROM ?? AS lq WHERE lq.?? = ?? AND ? < lq.??)`, [
            LicenseQuarantineColumn.EndsAt,
            LicenseQuarantine.tableName,
            LicenseQuarantineColumn.LicenseQuarantineId,
            LicenseColumn.QuarantineId,
            raw(CURRENT_TIMESTAMP),
            LicenseQuarantineColumn.EndsAt,
        ]).as('quarantine_ends_at');
    }

    static get isQuarantinedSelectColumn() {
        return raw(
            `(?? IS NOT NULL AND EXISTS (SELECT 1 FROM ?? AS lq WHERE lq.?? = ?? AND ? < lq.??))`,
            [
                LicenseColumn.QuarantineId,
                LicenseQuarantine.tableName,
                LicenseQuarantineColumn.LicenseQuarantineId,
                LicenseColumn.QuarantineId,
                raw(CURRENT_TIMESTAMP),
                LicenseQuarantineColumn.EndsAt,
            ],
        ).as('is_quarantined');
    }

    static get computedStatusSelectColumns() {
        return [
            LicenseWithIsActive.isActiveSelectColumn,
            LicenseWithIsActive.quarantineEndsAtSelectColumn,
            LicenseWithIsActive.isQuarantinedSelectColumn,
        ];
    }

    static get selectedColumns() {
        return [`${License.tableName}.*`, ...LicenseWithIsActive.computedStatusSelectColumns];
    }

    static getSelectQuery(trx: TransactionOrKnex) {
        const query = License.query(trx).select(this.selectedColumns);

        return query as QueryBuilder<LicenseWithIsActive, LicenseWithIsActive[]>;
    }

    isActive!: boolean;
    quarantineEndsAt!: Nullable<string>;
    isQuarantined!: boolean;
}
