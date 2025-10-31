import {Model} from '../../..';
import {mapValuesToSnakeCase} from '../../../../utils';

export const LicenseLimitColumn = {
    LicenseLimitId: 'licenseLimitId',
    Meta: 'meta',
    TenantId: 'tenantId',
    CreatorsLimitValue: 'creatorsLimitValue',
    StartedAt: 'startedAt',
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
    [LicenseLimitColumn.CreatorsLimitValue]!: number;
    [LicenseLimitColumn.StartedAt]!: string;
    [LicenseLimitColumn.CreatedBy]!: string;
    [LicenseLimitColumn.CreatedAt]!: string;
    [LicenseLimitColumn.UpdatedBy]!: string;
    [LicenseLimitColumn.UpdatedAt]!: string;
}
