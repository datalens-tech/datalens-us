import {z} from '../../../components/zod';
import {CollectionModel} from '../../../db/models/new/collection';
import Utils from '../../../utils';

import {collectionModel} from './collection-model';

const schema = z
    .object({
        collections: collectionModel.schema.array(),
    })
    .describe('Collection model array in object');

const format = async (data: {collections: CollectionModel[]}): Promise<z.infer<typeof schema>> => {
    return {
        collections: await Utils.macrotasksMap(data.collections, collectionModel.format),
    };
};

export const collectionModelArrayInObject = {
    schema,
    format,
};
