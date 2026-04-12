import {z} from '../../../components/zod';
import {ColorPaletteModel} from '../../../db/models/new/color-palette';
import Utils from '../../../utils';

import {colorPaletteModel} from './color-palette-model';

const schema = colorPaletteModel.schema.array().describe('Color palette model array');

export type ColorPaletteModelArray = z.infer<typeof schema>;

const format = async (data: ColorPaletteModel[]): Promise<ColorPaletteModelArray> => {
    return await Utils.macrotasksMap(data, colorPaletteModel.format);
};

export const colorPaletteModelArray = {
    schema,
    format,
};
