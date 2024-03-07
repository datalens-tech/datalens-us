import {ServiceArgs} from '../../services/new/types';
import {ColorPaletteModel, ColorPaletteModelColumn} from '../../db/models/new/color-palette';
import {logInfo} from '../../utils';

type GetColorPaletteArgs = {
    colorPaletteId: string;
};

export const getColorPalette = async (
    {ctx}: ServiceArgs,
    {colorPaletteId}: GetColorPaletteArgs,
) => {
    logInfo(ctx, 'GET_COLOR_PALETTE_START', {
        colorPaletteId,
    });

    const colorPalette = await ColorPaletteModel.query(ColorPaletteModel.replica)
        .select()
        .where({
            [ColorPaletteModelColumn.ColorPaletteId]: colorPaletteId,
        })
        .timeout(ColorPaletteModel.DEFAULT_QUERY_TIMEOUT);

    ctx.log('GET_COLOR_PALETTE_FINISH');

    return colorPalette;
};
