import {Model} from '../../..';
import {mapValuesToSnakeCase} from '../../../../utils';

export const LicenseLimitColumn = {
    LicenseLimitId: 'licenseLimitId',
    TenantId: 'tenantId',
    LimitValue: 'limitValue',
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
    [LicenseLimitColumn.TenantId]!: string;
    [LicenseLimitColumn.LimitValue]!: number;
    [LicenseLimitColumn.StartedAt]!: string;
    [LicenseLimitColumn.CreatedBy]!: string;
    [LicenseLimitColumn.CreatedAt]!: string;
    [LicenseLimitColumn.UpdatedBy]!: string;
    [LicenseLimitColumn.UpdatedAt]!: string;
}
