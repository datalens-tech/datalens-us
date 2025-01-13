import {z} from '../../../components/zod';
import type {CollectionInstance} from '../../../registry/common/entities/collection/types';
import Utils from '../../../utils';

import {collectionInstance} from './collection-instance';

const schema = collectionInstance.schema.array().describe('Collection instance array');

const format = (data: CollectionInstance[]): Promise<z.infer<typeof schema>> => {
    return Utils.macrotasksMap(data, collectionInstance.format);
};

export const collectionInstanceArray = {
    schema,
    format,
};
