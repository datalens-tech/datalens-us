import {Model} from '../../..';
import {mapValuesToSnakeCase} from '../../../../utils';

import {LicenseType} from './types';

export const LicenseColumn = {
    LicenseId: 'licenseId',
    Meta: 'meta',
    TenantId: 'tenantId',
    UserId: 'userId',
    LicenseType: 'licenseType',
    ExpiresAt: 'expiresAt',
    CreatedBy: 'createdBy',
    CreatedAt: 'createdAt',
    UpdatedBy: 'updatedBy',
    UpdatedAt: 'updatedAt',
} as const;

export const LicenseColumnRaw = mapValuesToSnakeCase(LicenseColumn);

export class License extends Model {
    static get tableName() {
        return 'licenses';
    }

    static get idColumn() {
        return LicenseColumn.LicenseId;
    }

    [LicenseColumn.LicenseId]!: string;
    [LicenseColumn.Meta]!: Record<string, unknown>;
    [LicenseColumn.TenantId]!: string;
    [LicenseColumn.UserId]!: string;
    [LicenseColumn.LicenseType]!: LicenseType;
    [LicenseColumn.ExpiresAt]!: Nullable<string>;
    [LicenseColumn.CreatedBy]!: string;
    [LicenseColumn.CreatedAt]!: string;
    [LicenseColumn.UpdatedBy]!: string;
    [LicenseColumn.UpdatedAt]!: string;
}
