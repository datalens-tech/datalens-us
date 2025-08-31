import {z} from '../../../components/zod';
import {Favorite} from '../../../db/models/new/favorite';
import Utils from '../../../utils';

import {favoriteModel} from './favorite-model';

const schema = favoriteModel.schema.array().describe('Favorite model array');

const format = async (data: Favorite[]): Promise<z.infer<typeof schema>> => {
    return await Utils.macrotasksMap(data, favoriteModel.format);
};

export const favoriteModelArray = {
    schema,
    format,
};
