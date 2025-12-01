import {QueryBuilder, RawBuilder, TransactionOrKnex, raw} from 'objection';

import {CURRENT_TIMESTAMP, OrderBy} from '../../../../../const';
import {LicenseLimit, LicenseLimitColumn} from '../../license-limit';
import {Tenant, TenantColumn} from '../index';

export class TenantWithCurrentLimit extends Tenant {
    protected static allIncreasedLimitsAlias = 'all_increased_limits';
    protected static currentLimitsAlias = 'current_limits';

    static getSelectQuery(
        trx: TransactionOrKnex,
        args?: {minCreatorsLimitValue?: number; checkTimestamp?: RawBuilder | string},
    ) {
        const minCreatorsLimitValue = args?.minCreatorsLimitValue ?? 0;
        const checkTimestamp = args?.checkTimestamp ?? raw(CURRENT_TIMESTAMP);

        const query = Tenant.query(trx)
            .with(this.allIncreasedLimitsAlias, (qb) => {
                qb.select([`${LicenseLimit.tableName}.${LicenseLimitColumn.TenantId}`])
                    .from(LicenseLimit.tableName)
                    .where(
                        `${LicenseLimit.tableName}.${LicenseLimitColumn.StartedAt}`,
                        '<=',
                        checkTimestamp,
                    )
                    .andWhere(
                        `${LicenseLimit.tableName}.${LicenseLimitColumn.CreatorsLimitValue}`,
                        '>=',
                        minCreatorsLimitValue,
                    )
                    .groupBy(LicenseLimitColumn.TenantId);
            })
            .with(this.currentLimitsAlias, (qb) => {
                qb.select([
                    `${LicenseLimit.tableName}.${LicenseLimitColumn.TenantId}`,
                    `${LicenseLimit.tableName}.${LicenseLimitColumn.CreatorsLimitValue}`,
                ])
                    .distinctOn(`${LicenseLimit.tableName}.${LicenseLimitColumn.TenantId}`)
                    .from(LicenseLimit.tableName)
                    .whereRaw(`?? IN (SELECT ?? FROM ??)`, [
                        `${LicenseLimit.tableName}.${LicenseLimitColumn.TenantId}`,
                        LicenseLimitColumn.TenantId,
                        raw(this.allIncreasedLimitsAlias),
                    ])
                    .where(
                        `${LicenseLimit.tableName}.${LicenseLimitColumn.StartedAt}`,
                        '<=',
                        checkTimestamp,
                    )
                    .orderBy([
                        {
                            column: `${LicenseLimit.tableName}.${LicenseLimitColumn.TenantId}`,
                            order: OrderBy.Asc,
                        },
                        {
                            column: `${LicenseLimit.tableName}.${LicenseLimitColumn.StartedAt}`,
                            order: OrderBy.Desc,
                        },
                    ]);
            })
            .select([
                `${Tenant.tableName}.*`,
                raw(`?? IS NOT NULL AND ?? > ?`, [
                    `${Tenant.tableName}.${TenantColumn.TrialEndedAt}`,
                    `${Tenant.tableName}.${TenantColumn.TrialEndedAt}`,
                    checkTimestamp,
                ]).as('trial_is_active'),
                `${this.currentLimitsAlias}.${LicenseLimitColumn.CreatorsLimitValue}`,
            ])
            .innerJoin(
                this.currentLimitsAlias,
                `${Tenant.tableName}.${TenantColumn.TenantId}`,
                `${this.currentLimitsAlias}.${LicenseLimitColumn.TenantId}`,
            )
            .where(
                `${this.currentLimitsAlias}.${LicenseLimitColumn.CreatorsLimitValue}`,
                '>=',
                minCreatorsLimitValue,
            );

        return query as QueryBuilder<TenantWithCurrentLimit, TenantWithCurrentLimit[]>;
    }

    [LicenseLimitColumn.CreatorsLimitValue]!: LicenseLimit[typeof LicenseLimitColumn.CreatorsLimitValue];
    trialIsActive!: boolean;
}
