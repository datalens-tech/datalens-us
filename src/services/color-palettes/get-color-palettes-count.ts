import {makeSchemaValidator} from '../../components/validation-schema-compiler';
import {ColorPaletteModel, ColorPaletteModelColumn} from '../../db/models/new/color-palette';
import {CountAggregation, ServiceArgs} from '../../services/new/types';
import {getReplica} from '../../services/new/utils';

const validateArgs = makeSchemaValidator({
    type: 'object',
    required: ['isGradient'],
    properties: {
        isGradient: {
            type: 'boolean',
        },
    },
});

export interface CheckColorPalettesCountArgs {
    isGradient: boolean;
}

export const getColorPalettesCount = async (
    {ctx, trx, skipValidation = false}: ServiceArgs,
    args: CheckColorPalettesCountArgs,
) => {
    const {isGradient} = args;

    ctx.log('GET_COLOR_PALETTE_COUNT_START', {
        isGradient,
    });

    const {tenantId} = ctx.get('info');

    if (!skipValidation) {
        validateArgs(args);
    }

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
