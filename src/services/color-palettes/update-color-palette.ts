import {AppError} from '@gravity-ui/nodekit';
import {transaction} from 'objection';

import {US_ERRORS} from '../../const';
import {ColorPaletteModel, ColorPaletteModelColumn} from '../../db/models/new/color-palette';
import {WorkbookModel} from '../../db/models/new/workbook';
import {ServiceArgs} from '../../services/new/types';
import {getPrimary} from '../../services/new/utils';
import Utils from '../../utils';

export interface UpdateColorPaletteArgs {
    colorPaletteId: string;
    displayName: string;
    colors: string[];
    isGradient: boolean;
    isDefault: boolean;
}

export const updateColorPalette = async ({ctx, trx}: ServiceArgs, args: UpdateColorPaletteArgs) => {
    const {colorPaletteId, displayName, colors, isGradient, isDefault} = args;

    ctx.log('UPDATE_COLOR_PALETTE_START', {
        colorPaletteId: Utils.encodeId(colorPaletteId),
        displayName,
        colors,
        isGradient,
        isDefault,
    });

    const {tenantId} = ctx.get('info');

    const targetTrx = getPrimary(trx);

    const result = await transaction(targetTrx, async (transactionTrx) => {
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
            .patch({
                [ColorPaletteModelColumn.DisplayName]: displayName,
                [ColorPaletteModelColumn.Name]: displayName.toLowerCase(),
                [ColorPaletteModelColumn.IsDefault]: isDefault,
                [ColorPaletteModelColumn.IsGradient]: isGradient,
                [ColorPaletteModelColumn.Colors]: JSON.stringify(colors) as any,
            })
            .where({
                [ColorPaletteModelColumn.ColorPaletteId]: colorPaletteId,
                [ColorPaletteModelColumn.TenantId]: tenantId,
            })
            .returning('*')
            .first()
            .timeout(WorkbookModel.DEFAULT_QUERY_TIMEOUT);

        return model;
    });

    if (!result) {
        throw new AppError(US_ERRORS.COLOR_PALETTE_NOT_EXISTS, {
            code: US_ERRORS.COLOR_PALETTE_NOT_EXISTS,
        });
    }

    ctx.log('UPDATE_COLOR_PALETTE_FINISH', {
        colorPaletteId: Utils.encodeId(result.colorPaletteId),
    });

    return result;
};
