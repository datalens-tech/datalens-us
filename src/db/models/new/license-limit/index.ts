import {Model} from '../../..';
import {mapValuesToSnakeCase} from '../../../../utils';

import {LicenseLimitReason} from './types';

export const LicenseLimitColumn = {
    LicenseLimitId: 'licenseLimitId',
    Meta: 'meta',
    TenantId: 'tenantId',
    StartedAt: 'startedAt',
    Reason: 'reason',
    CreatorsLimitValue: 'creatorsLimitValue',
    CreatedBy: 'createdBy',
    CreatedAt: 'createdAt',
    UpdatedBy: 'updatedBy',
    UpdatedAt: 'updatedAt',
} as const;

export const LicenseLimitColumnRaw = mapValuesToSnakeCase(LicenseLimitColumn);

export class LicenseLimit extends Model {
    static get tableName() {
        return 'license_limits';
    }

    static get idColumn() {
        return LicenseLimitColumn.LicenseLimitId;
    }

    [LicenseLimitColumn.LicenseLimitId]!: string;
    [LicenseLimitColumn.Meta]!: Record<string, unknown>;
    [LicenseLimitColumn.TenantId]!: string;
    [LicenseLimitColumn.StartedAt]!: string;
    [LicenseLimitColumn.Reason]!: LicenseLimitReason;
    [LicenseLimitColumn.CreatorsLimitValue]!: number;
    [LicenseLimitColumn.CreatedBy]!: string;
    [LicenseLimitColumn.CreatedAt]!: string;
    [LicenseLimitColumn.UpdatedBy]!: string;
    [LicenseLimitColumn.UpdatedAt]!: string;
}
