import {ColorPaletteModel} from '../../../db/models/new/color-palette';

export const formatColorPalette = (colorPaletteModel: ColorPaletteModel) => {
    const {colorPaletteId, displayName, colors, isDefault, isGradient} = colorPaletteModel;

    return {
        colorPaletteId,
        displayName,
        colors,
        isDefault,
        isGradient,
    };
};

export const formatColorPaletteList = (colorPalettes: ColorPaletteModel[]) => {
    return colorPalettes.map(formatColorPalette);
};
