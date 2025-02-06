import {AppError} from '@gravity-ui/nodekit';
import {transaction} from 'objection';

import {US_ERRORS} from '../../const';
import {ColorPaletteModel, ColorPaletteModelColumn} from '../../db/models/new/color-palette';
import {ServiceArgs} from '../../services/new/types';
import Utils from '../../utils';

import {getColorPalettesCount} from './get-color-palettes-count';

const MAX_PALETTES_COUNT = 50;

export interface CreateColorPaletteArgs {
    displayName: string;
    colors: string[];
    isGradient: boolean;
    isDefault: boolean;
}

export const createColorPalette = async (
    {ctx, skipValidation = false}: ServiceArgs,
    args: CreateColorPaletteArgs,
) => {
    const {displayName, colors, isGradient, isDefault} = args;

    ctx.log('CREATE_COLOR_PALETTE_START', {
        displayName,
        colors,
        isGradient,
        isDefault,
    });

    const registry = ctx.get('registry');
    const {colorPalettesAdminValidator} = registry.common.functions.get();

    if (!skipValidation) {
        colorPalettesAdminValidator(ctx);
    }

    const colorPalettesCount = await getColorPalettesCount(
        {ctx, skipValidation},
        {
            isGradient,
        },
    );

    const isNotPossibleToCreatePalette = colorPalettesCount > MAX_PALETTES_COUNT;

    if (isNotPossibleToCreatePalette) {
        const message = `Too many color palettes: only ${MAX_PALETTES_COUNT}, ${
            isGradient ? 'gradient' : 'plain'
        } color palettes are allowed`;

        throw new AppError(message, {
            code: US_ERRORS.TOO_MANY_COLOR_PALETTES,
            details: {
                maxPalettesCount: MAX_PALETTES_COUNT,
            },
        });
    }

    const {tenantId} = ctx.get('info');

    ctx.log('CREATE_COLOR_PALETTE_IN_DB_START');

    const result = await transaction(ColorPaletteModel.primary, async (transactionTrx) => {
        if (isDefault) {
            await ColorPaletteModel.query(transactionTrx)
                .patch({
                    [ColorPaletteModelColumn.IsDefault]: false,
                })
                .where({
                    [ColorPaletteModelColumn.IsDefault]: true,
                    [ColorPaletteModelColumn.IsGradient]: isGradient,
                    [ColorPaletteModelColumn.TenantId]: tenantId,
                })
                .timeout(ColorPaletteModel.DEFAULT_QUERY_TIMEOUT);
        }

        const model = await ColorPaletteModel.query(transactionTrx)
            .insert({
                [ColorPaletteModelColumn.DisplayName]: displayName,
                [ColorPaletteModelColumn.Name]: displayName.toLocaleLowerCase(),
                [ColorPaletteModelColumn.Colors]: JSON.stringify(colors) as any,
                [ColorPaletteModelColumn.TenantId]: tenantId,
                [ColorPaletteModelColumn.IsDefault]: isDefault,
                [ColorPaletteModelColumn.IsGradient]: isGradient,
            })
            .returning('*')
            .timeout(ColorPaletteModel.DEFAULT_QUERY_TIMEOUT);

        ctx.log('CREATE_COLOR_PALETTE_IN_DB_FINISH', {
            colorPaletteId: Utils.encodeId(model[ColorPaletteModelColumn.ColorPaletteId]),
        });

        return model;
    });

    return result;
};
