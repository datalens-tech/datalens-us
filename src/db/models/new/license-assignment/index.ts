import {Model} from '../../..';
import {mapValuesToSnakeCase} from '../../../../utils';

import {LicenseType} from './types';

export const LicenseAssignmentColumn = {
    LicenseAssignmentId: 'licenseAssignmentId',
    TenantId: 'tenantId',
    UserId: 'userId',
    LicenseType: 'licenseType',
    ExpiresAt: 'expiresAt',
    CreatedBy: 'createdBy',
    CreatedAt: 'createdAt',
    UpdatedBy: 'updatedBy',
    UpdatedAt: 'updatedAt',
} as const;

export const LicenseAssignmentColumnRaw = mapValuesToSnakeCase(LicenseAssignmentColumn);

export class LicenseAssignment extends Model {
    static get tableName() {
        return 'license_assignments';
    }

    static get idColumn() {
        return LicenseAssignmentColumn.LicenseAssignmentId;
    }

    [LicenseAssignmentColumn.LicenseAssignmentId]!: string;
    [LicenseAssignmentColumn.TenantId]!: string;
    [LicenseAssignmentColumn.UserId]!: string;
    [LicenseAssignmentColumn.LicenseType]!: `${LicenseType}`;
    [LicenseAssignmentColumn.ExpiresAt]!: Nullable<string>;
    [LicenseAssignmentColumn.CreatedBy]!: string;
    [LicenseAssignmentColumn.CreatedAt]!: string;
    [LicenseAssignmentColumn.UpdatedBy]!: string;
    [LicenseAssignmentColumn.UpdatedAt]!: string;
}
