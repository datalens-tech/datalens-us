import {ColorPaletteNotExistsError} from '../../components/errors';
import {ColorPaletteModel, ColorPaletteModelColumn} from '../../db/models/new/color-palette';
import {ServiceArgs} from '../../services/new/types';

export interface DeleteColorPaletteArgs {
    colorPaletteId: string;
}

export const deleteColorPalette = async (
    {ctx}: ServiceArgs,
    args: DeleteColorPaletteArgs,
): Promise<ColorPaletteModel> => {
    const {colorPaletteId} = args;

    ctx.log('DELETE_COLOR_PALETTE_START', {
        colorPaletteId,
    });

    const registry = ctx.get('registry');
    const {checkColorPalettesAdmin} = registry.common.functions.get();

    await checkColorPalettesAdmin(ctx);

    const {tenantId} = ctx.get('info');

    const result = await ColorPaletteModel.query(ColorPaletteModel.primary)
        .where({
            [ColorPaletteModelColumn.ColorPaletteId]: colorPaletteId,
            [ColorPaletteModelColumn.TenantId]: tenantId,
        })
        .delete()
        .returning('*')
        .first()
        .timeout(ColorPaletteModel.DEFAULT_QUERY_TIMEOUT);

    if (!result) {
        throw new ColorPaletteNotExistsError();
    }

    ctx.log('DELETE_COLOR_PALETTE_FINISH', {
        colorPaletteId,
    });

    return result;
};
