import {Model} from '../../..';
import {mapValuesToSnakeCase} from '../../../../utils';

import {LicenseType} from './types';

export const LicenseAssignmentColumn = {
    LicenseAssignmentId: 'licenseAssignmentId',
    TenantId: 'tenantId',
    UserId: 'userId',
    LicenseType: 'licenseType',
    ExpiredAt: 'expiredAt',
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
    [LicenseAssignmentColumn.ExpiredAt]!: Nullable<string>;
}
