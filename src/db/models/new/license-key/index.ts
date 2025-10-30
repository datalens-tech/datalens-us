import {Model} from '../../..';
import {mapValuesToSnakeCase} from '../../../../utils';

export const LicenseKeyColumn = {
    LicenseKeyId: 'licenseKeyId',
    Meta: 'meta',
    TenantId: 'tenantId',
    Value: 'value',
    StartedAt: 'startedAt',
    EndedAt: 'endedAt',
    CreatedBy: 'createdBy',
    CreatedAt: 'createdAt',
} as const;

export const LicenseKeyColumnRaw = mapValuesToSnakeCase(LicenseKeyColumn);

export class LicenseKey extends Model {
    static get tableName() {
        return 'license_keys';
    }

    static get idColumn() {
        return LicenseKeyColumn.LicenseKeyId;
    }

    [LicenseKeyColumn.LicenseKeyId]!: string;
    [LicenseKeyColumn.Meta]!: Record<string, unknown>;
    [LicenseKeyColumn.TenantId]!: string;
    [LicenseKeyColumn.Value]!: string;
    [LicenseKeyColumn.StartedAt]!: string;
    [LicenseKeyColumn.EndedAt]!: string;
    [LicenseKeyColumn.CreatedBy]!: string;
    [LicenseKeyColumn.CreatedAt]!: string;
}
