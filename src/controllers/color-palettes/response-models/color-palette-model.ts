import {z} from '../../../components/zod';
import {ColorPaletteModel} from '../../../db/models/new/color-palette';
import Utils from '../../../utils';

const schema = z
    .object({
        colorPaletteId: z.string(),
        displayName: z.string(),
        colors: z.string().array(),
        isDefault: z.boolean(),
        isGradient: z.boolean(),
    })
    .describe('Color palette model');

export type ColorPaletteResponseModel = z.infer<typeof schema>;

const format = (colorPaletteModel: ColorPaletteModel): ColorPaletteResponseModel => {
    const {colorPaletteId, displayName, colors, isDefault, isGradient} = colorPaletteModel;

    return {
        colorPaletteId: Utils.encodeId(colorPaletteId),
        displayName,
        colors,
        isDefault,
        isGradient,
    };
};

export const colorPaletteModel = {
    schema,
    format,
};
