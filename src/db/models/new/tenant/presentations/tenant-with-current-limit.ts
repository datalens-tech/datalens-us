import {QueryBuilder, RawBuilder, TransactionOrKnex, raw} from 'objection';

import {CURRENT_TIMESTAMP, OrderBy} from '../../../../../const';
import {LicenseLimit, LicenseLimitColumn} from '../../license-limit';
import {Tenant, TenantColumn} from '../index';

export class TenantWithCurrentLimit extends Tenant {
    protected static currentLimitsAlias = 'current_limits';

    static getSelectQuery(trx: TransactionOrKnex, args?: {checkTimestamp?: RawBuilder | string}) {
        const checkTimestamp = args?.checkTimestamp ?? raw(CURRENT_TIMESTAMP);

        const query = Tenant.query(trx)
            .with(this.currentLimitsAlias, (qb) => {
                qb.select([LicenseLimitColumn.TenantId, LicenseLimitColumn.CreatorsLimitValue])
                    .distinctOn(LicenseLimitColumn.TenantId)
                    .from(LicenseLimit.tableName)
                    .where(LicenseLimitColumn.StartedAt, '<=', checkTimestamp)
                    .orderBy([
                        {column: LicenseLimitColumn.TenantId},
                        {column: LicenseLimitColumn.StartedAt, order: OrderBy.Desc},
                    ]);
            })
            .select(
                `${Tenant.tableName}.*`,
                raw(`?? IS NOT NULL AND ?? > ?`, [
                    `${Tenant.tableName}.${TenantColumn.TrialEndedAt}`,
                    `${Tenant.tableName}.${TenantColumn.TrialEndedAt}`,
                    checkTimestamp,
                ]).as('trial_is_active'),
                `${this.currentLimitsAlias}.${LicenseLimitColumn.CreatorsLimitValue}`,
            )
            .innerJoin(
                this.currentLimitsAlias,
                `${Tenant.tableName}.${TenantColumn.TenantId}`,
                `${this.currentLimitsAlias}.${LicenseLimitColumn.TenantId}`,
            );

        return query as QueryBuilder<TenantWithCurrentLimit, TenantWithCurrentLimit[]>;
    }

    [LicenseLimitColumn.CreatorsLimitValue]!: LicenseLimit[typeof LicenseLimitColumn.CreatorsLimitValue];
    trialIsActive!: boolean;
}
