import {ServiceArgs} from '../../services/new/types';
import {makeSchemaValidator} from '../../components/validation-schema-compiler';
import {ColorPaletteModel, ColorPaletteModelColumn} from '../../db/models/new/color-palette';
import {registry} from '../../registry';

const validateArgs = makeSchemaValidator({
    type: 'object',
    required: ['colorPaletteId'],
    properties: {
        colorPaletteId: {
            type: 'string',
        },
    },
});

export interface DeleteColorPaletteArgs {
    colorPaletteId: string;
}

export const deleteColorPalette = async (
    {ctx, skipValidation = false}: ServiceArgs,
    args: DeleteColorPaletteArgs,
) => {
    const {colorPaletteId} = args;

    ctx.log('DELETE_COLOR_PALETTE_START', {
        colorPaletteId,
    });

    const {colorPalettesAdminValidator} = registry.common.functions.get();

    if (!skipValidation) {
        colorPalettesAdminValidator(ctx);
        validateArgs(args);
    }

    const {tenantId} = ctx.get('info');

    await ColorPaletteModel.query(ColorPaletteModel.primary)
        .where({
            [ColorPaletteModelColumn.ColorPaletteId]: colorPaletteId,
            [ColorPaletteModelColumn.TenantId]: tenantId,
        })
        .delete()
        .timeout(ColorPaletteModel.DEFAULT_QUERY_TIMEOUT);

    ctx.log('DELETE_COLOR_PALETTE_FINISH', {
        colorPaletteId,
    });
};
