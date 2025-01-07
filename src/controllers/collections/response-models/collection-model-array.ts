import {z} from '../../../components/zod';
import {CollectionModel} from '../../../db/models/new/collection';
import Utils from '../../../utils';

import {collectionModel} from './collection-model';

const schema = collectionModel.schema.array().describe('Collection model array');

const format = (data: CollectionModel[]): Promise<z.infer<typeof schema>> => {
    return Utils.macrotasksMap(data, collectionModel.format);
};

export const collectionModelArray = {
    schema,
    format,
};
