import {Model} from '../../..';

export const ColorPaletteModelColumn = {
    ColorPaletteId: 'colorPaletteId',
    TenantId: 'tenantId',
    Name: 'name',
    DisplayName: 'displayName',
    Colors: 'colors',
    IsGradient: 'isGradient',
    IsDefault: 'isDefault',
} as const;

export class ColorPaletteModel extends Model {
    static get tableName() {
        return 'colorPalettes';
    }

    static get idColumn() {
        return ColorPaletteModelColumn.ColorPaletteId;
    }

    [ColorPaletteModelColumn.ColorPaletteId]!: string;
    [ColorPaletteModelColumn.TenantId]!: string;
    [ColorPaletteModelColumn.Name]!: string;
    [ColorPaletteModelColumn.DisplayName]!: string;
    [ColorPaletteModelColumn.Colors]!: string[];
    [ColorPaletteModelColumn.IsGradient]!: boolean;
    [ColorPaletteModelColumn.IsDefault]!: boolean;
}
