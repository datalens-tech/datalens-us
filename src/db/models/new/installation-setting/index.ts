import {Model} from '../../..';
import {mapValuesToSnakeCase} from '../../../../utils';

export const InstallationSettingColumn = {
    Name: 'name',
    Data: 'data',
    CreatedAt: 'createdAt',
    UpdatedAt: 'updatedAt',
} as const;

export const InstallationSettingColumnRaw = mapValuesToSnakeCase(InstallationSettingColumn);

export class InstallationSetting extends Model {
    static get tableName() {
        return 'installation_settings';
    }

    static get idColumn() {
        return InstallationSettingColumn.Name;
    }

    [InstallationSettingColumn.Name]!: string;
    [InstallationSettingColumn.Data]!: Record<string, unknown>;
    [InstallationSettingColumn.CreatedAt]!: string;
    [InstallationSettingColumn.UpdatedAt]!: string;
}
