import {AppError} from '@gravity-ui/nodekit';

import {US_ERRORS} from '../../const';
import {ColorPaletteModel, ColorPaletteModelColumn} from '../../db/models/new/color-palette';
import {ServiceArgs} from '../../services/new/types';

export interface DeleteColorPaletteArgs {
    colorPaletteId: string;
}

export const deleteColorPalette = async (
    {ctx, skipValidation = false}: ServiceArgs,
    args: DeleteColorPaletteArgs,
): Promise<ColorPaletteModel> => {
    const {colorPaletteId} = args;

    ctx.log('DELETE_COLOR_PALETTE_START', {
        colorPaletteId,
    });

    const registry = ctx.get('registry');
    const {colorPalettesAdminValidator} = registry.common.functions.get();

    if (!skipValidation) {
        colorPalettesAdminValidator(ctx);
    }

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
        throw new AppError(US_ERRORS.COLOR_PALETTE_NOT_EXISTS, {
            code: US_ERRORS.COLOR_PALETTE_NOT_EXISTS,
        });
    }

    ctx.log('DELETE_COLOR_PALETTE_FINISH', {
        colorPaletteId,
    });

    return result;
};
