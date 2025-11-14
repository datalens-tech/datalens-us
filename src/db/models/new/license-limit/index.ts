import {Model} from '../../..';
import {mapValuesToSnakeCase} from '../../../../utils';

import {LicenseLimitMeta, LicenseLimitType} from './types';

export const LicenseLimitColumn = {
    LicenseLimitId: 'licenseLimitId',
    Meta: 'meta',
    TenantId: 'tenantId',
    Type: 'type',
    StartedAt: 'startedAt',
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
    [LicenseLimitColumn.Meta]!: LicenseLimitMeta;
    [LicenseLimitColumn.TenantId]!: string;
    [LicenseLimitColumn.Type]!: LicenseLimitType;
    [LicenseLimitColumn.StartedAt]!: string;
    [LicenseLimitColumn.CreatorsLimitValue]!: number;
    [LicenseLimitColumn.CreatedBy]!: string;
    [LicenseLimitColumn.CreatedAt]!: string;
    [LicenseLimitColumn.UpdatedBy]!: string;
    [LicenseLimitColumn.UpdatedAt]!: string;
}
