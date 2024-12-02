import {ColorPaletteModel, ColorPaletteModelColumn} from '../../db/models/new/color-palette';
import {ServiceArgs} from '../../services/new/types';
import Utils from '../../utils';

const PAGE = 0;

const PAGE_SIZE = 50;

type GetColorPalettesListArgs = {
    filters?: {
        colorPaletteId?: string;
    };
};

export const getColorPalettesList = async (
    {ctx}: ServiceArgs,
    {filters}: GetColorPalettesListArgs,
) => {
    const {tenantId} = ctx.get('info');

    ctx.log('GET_COLOR_PALETTES_LIST_START', {
        tenantId,
        filters,
    });

    const colorPaletteId = filters?.colorPaletteId || '';

    let decodedPaletteId = '';

    try {
        decodedPaletteId = Utils.decodeId(colorPaletteId);
    } catch {
        ctx.log('GET_COLOR_PALETTES_LIST_FAILED_DECODING');

        return [];
    }

    const colorPalettesPage = await ColorPaletteModel.query(ColorPaletteModel.primary)
        .select()
        .where((qb) => {
            qb.where({
                [ColorPaletteModelColumn.TenantId]: tenantId,
            });

            if (colorPaletteId) {
                qb.andWhere({
                    [ColorPaletteModelColumn.ColorPaletteId]: decodedPaletteId,
                });
            }
        })
        .page(PAGE, PAGE_SIZE)
        .timeout(ColorPaletteModel.DEFAULT_QUERY_TIMEOUT);

    ctx.log('GET_COLOR_PALETTES_LIST_FINISH');

    return colorPalettesPage.results;
};
