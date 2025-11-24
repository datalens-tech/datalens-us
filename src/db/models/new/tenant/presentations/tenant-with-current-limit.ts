import {QueryBuilder, RawBuilder, TransactionOrKnex, raw} from 'objection';

import {CURRENT_TIMESTAMP, OrderBy} from '../../../../../const';
import {LicenseLimit, LicenseLimitColumn, LicenseLimitColumnRaw} from '../../license-limit';
import {Tenant, TenantColumn} from '../index';

export class TenantWithCurrentLimit extends Tenant {
    static getSelectQuery(
        trx: TransactionOrKnex,
        args?: {minCreatorsLimitValue?: number; checkTimestamp?: RawBuilder | string},
    ) {
        const minCreatorsLimitValue = args?.minCreatorsLimitValue ?? 0;
        const checkTimestamp = args?.checkTimestamp ?? raw(CURRENT_TIMESTAMP);

        const query = Tenant.query(trx)
            .select(
                `${Tenant.tableName}.*`,
                raw(`?? IS NOT NULL AND ?? > ?`, [
                    `${Tenant.tableName}.${TenantColumn.TrialEndedAt}`,
                    `${Tenant.tableName}.${TenantColumn.TrialEndedAt}`,
                    checkTimestamp,
                ]).as('trial_is_active'),
                this.getCurrentLicenseLimitSubQuery({
                    trx,
                    checkTimestamp,
                }).as(LicenseLimitColumnRaw.CreatorsLimitValue),
            )
            .whereRaw(`(??) >= ?`, [
                this.getCurrentLicenseLimitSubQuery({
                    trx,
                    checkTimestamp,
                }),
                minCreatorsLimitValue,
            ]);

        return query as QueryBuilder<TenantWithCurrentLimit, TenantWithCurrentLimit[]>;
    }

    private static getCurrentLicenseLimitSubQuery({
        trx,
        checkTimestamp,
    }: {
        trx: TransactionOrKnex;
        checkTimestamp: RawBuilder | string;
    }) {
        return LicenseLimit.query(trx)
            .select(LicenseLimitColumn.CreatorsLimitValue)
            .whereRaw('?? = ??', [
                `${LicenseLimit.tableName}.${LicenseLimitColumn.TenantId}`,
                `${Tenant.tableName}.${TenantColumn.TenantId}`,
            ])
            .andWhere(
                `${LicenseLimit.tableName}.${LicenseLimitColumn.StartedAt}`,
                '<=',
                checkTimestamp,
            )
            .orderBy(`${LicenseLimit.tableName}.${LicenseLimitColumn.StartedAt}`, OrderBy.Desc)
            .limit(1);
    }

    [LicenseLimitColumn.CreatorsLimitValue]!: LicenseLimit[typeof LicenseLimitColumn.CreatorsLimitValue];
    trialIsActive!: boolean;
}
