import {z} from '../../../components/zod';
import type {CollectionInstance} from '../../../registry/plugins/common/entities/collection/types';
import Utils from '../../../utils';

import {collectionInstance} from './collection-instance';

const schema = collectionInstance.schema.array().describe('Collection instance array');

const format = async (data: {
    collections: CollectionInstance[];
    includePermissionsInfo?: boolean;
}): Promise<z.infer<typeof schema>> => {
    const {collections, includePermissionsInfo} = data;
    return Utils.macrotasksMap(collections, (collection) =>
        collectionInstance.format({collection, includePermissionsInfo}),
    );
};

export const collectionInstanceArray = {
    schema,
    format,
};
