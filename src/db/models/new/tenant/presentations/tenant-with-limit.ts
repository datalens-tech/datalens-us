import {QueryBuilder, TransactionOrKnex, raw} from 'objection';

import {CURRENT_TIMESTAMP} from '../../../../../const';
import {LicenseLimit, LicenseLimitColumn, LicenseLimitColumnRaw} from '../../license-limit';
import {Tenant, TenantColumnRaw} from '../index';

export class TenantWithLimit extends Tenant {
    static getSelectQuery(trx: TransactionOrKnex) {
        // TODO: check performance
        const query = Tenant.query(trx)
            .select([`${Tenant.tableName}.*`, `l.${LicenseLimitColumnRaw.CreatorsLimitValue}`])
            .leftJoin(
                raw(
                    `LATERAL (
                        SELECT ??
                        FROM ??
                        WHERE
                            ?? = ?? AND
                            ?? <= ?
                        ORDER BY ?? DESC
                        LIMIT 1
                    ) as l ON true`,
                    [
                        LicenseLimitColumnRaw.CreatorsLimitValue,
                        LicenseLimit.tableName,
                        `${LicenseLimit.tableName}.${LicenseLimitColumnRaw.TenantId}`,
                        `${Tenant.tableName}.${TenantColumnRaw.TenantId}`,
                        `${LicenseLimit.tableName}.${LicenseLimitColumnRaw.StartedAt}`,
                        raw(CURRENT_TIMESTAMP),
                        `${LicenseLimit.tableName}.${LicenseLimitColumnRaw.StartedAt}`,
                    ],
                ),
            );

        return query as unknown as QueryBuilder<TenantWithLimit, TenantWithLimit[]>;
    }

    [LicenseLimitColumn.CreatorsLimitValue]!: LicenseLimit[typeof LicenseLimitColumn.CreatorsLimitValue];
}
