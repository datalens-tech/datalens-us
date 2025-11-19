import {QueryBuilder, RawBuilder, TransactionOrKnex, raw} from 'objection';

import {CURRENT_TIMESTAMP, OrderBy} from '../../../../../const';
import {LicenseLimit, LicenseLimitColumn} from '../../license-limit';
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
                    minCreatorsLimitValue,
                    checkTimestamp,
                    inSelect: true,
                }),
            )
            .whereExists(
                this.getCurrentLicenseLimitSubQuery({
                    trx,
                    minCreatorsLimitValue,
                    checkTimestamp,
                }),
            );

        return query as QueryBuilder<TenantWithCurrentLimit, TenantWithCurrentLimit[]>;
    }

    private static getCurrentLicenseLimitSubQuery({
        trx,
        minCreatorsLimitValue,
        checkTimestamp,
        inSelect = false,
    }: {
        trx: TransactionOrKnex;
        minCreatorsLimitValue: number;
        checkTimestamp: RawBuilder | string;
        inSelect?: boolean;
    }) {
        const query = LicenseLimit.query(trx)
            .select(inSelect ? LicenseLimitColumn.CreatorsLimitValue : raw('1'))
            .whereRaw('?? = ??', [
                `${LicenseLimit.tableName}.${LicenseLimitColumn.TenantId}`,
                `${Tenant.tableName}.${TenantColumn.TenantId}`,
            ])
            .andWhere(
                `${LicenseLimit.tableName}.${LicenseLimitColumn.CreatorsLimitValue}`,
                '>=',
                minCreatorsLimitValue,
            )
            .andWhere(
                `${LicenseLimit.tableName}.${LicenseLimitColumn.StartedAt}`,
                '<=',
                checkTimestamp,
            )
            .orderBy(`${LicenseLimit.tableName}.${LicenseLimitColumn.StartedAt}`, OrderBy.Desc)
            .limit(1);

        if (inSelect) {
            query.as(LicenseLimitColumn.CreatorsLimitValue);
        }

        return query;
    }

    [LicenseLimitColumn.CreatorsLimitValue]!: LicenseLimit[typeof LicenseLimitColumn.CreatorsLimitValue];
    trialIsActive!: boolean;
}
