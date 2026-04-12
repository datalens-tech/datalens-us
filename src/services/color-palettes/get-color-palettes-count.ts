import {ColorPaletteModel, ColorPaletteModelColumn} from '../../db/models/new/color-palette';
import {CountAggregation, ServiceArgs} from '../../services/new/types';
import {getReplica} from '../../services/new/utils';

export interface CheckColorPalettesCountArgs {
    isGradient: boolean;
}

export const getColorPalettesCount = async (
    {ctx, trx}: ServiceArgs,
    args: CheckColorPalettesCountArgs,
) => {
    const {isGradient} = args;

    ctx.log('GET_COLOR_PALETTE_COUNT_START', {
        isGradient,
    });

    const {tenantId} = ctx.get('info');

    const targetTrx = getReplica(trx);

    const count = (await ColorPaletteModel.query(targetTrx)
        .select()
        .count()
        .where({
            [ColorPaletteModelColumn.TenantId]: tenantId,
            [ColorPaletteModelColumn.IsGradient]: isGradient,
        })
        .first()
        .timeout(ColorPaletteModel.DEFAULT_QUERY_TIMEOUT)) as CountAggregation;

    const result = Number(count?.count || 0);

    ctx.log('GET_COLOR_PALETTE_COUNT_FINISH', {result});

    return result;
};
