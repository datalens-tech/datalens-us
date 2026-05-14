import {Model} from '../../..';
import {mapValuesToSnakeCase} from '../../../../utils';
import {LicenseType} from '../license/types';

import {LicenseQuarantineMeta} from './types';

export const LicenseQuarantineColumn = {
    LicenseQuarantineId: 'licenseQuarantineId',
    LicenseType: 'licenseType',
    StartedAt: 'startedAt',
    EndsAt: 'endsAt',
    TenantId: 'tenantId',
    Meta: 'meta',
} as const;

export const LicenseQuarantineColumnRaw = mapValuesToSnakeCase(LicenseQuarantineColumn);

export class LicenseQuarantine extends Model {
    static get tableName() {
        return 'license_quarantines';
    }

    static get idColumn() {
        return LicenseQuarantineColumn.LicenseQuarantineId;
    }

    [LicenseQuarantineColumn.LicenseQuarantineId]!: string;
    [LicenseQuarantineColumn.LicenseType]!: LicenseType;
    [LicenseQuarantineColumn.StartedAt]!: string;
    [LicenseQuarantineColumn.EndsAt]!: string;
    [LicenseQuarantineColumn.TenantId]!: string;
    [LicenseQuarantineColumn.Meta]!: LicenseQuarantineMeta;
}
