import {z} from '../../../components/zod';
import type {CollectionInstance} from '../../../registry/plugins/common/entities/collection/types';

import {collectionModel} from './collection-model';

export const collectionPermissionsSchema = z
    .object({
        listAccessBindings: z.boolean(),
        updateAccessBindings: z.boolean(),
        createCollection: z.boolean(),
        createWorkbook: z.boolean(),
        createSharedEntry: z.boolean(),
        createSparkCluster: z.boolean(),
        createTrinoCluster: z.boolean(),
        limitedView: z.boolean(),
        view: z.boolean(),
        update: z.boolean(),
        copy: z.boolean(),
        move: z.boolean(),
        delete: z.boolean(),
    })
    .describe('Collection permissions');

const schema = collectionModel.schema
    .extend({
        permissions: collectionPermissionsSchema.optional(),
    })
    .describe('Collection instance');

const format = ({
    collection,
    includePermissionsInfo,
}: {
    collection: CollectionInstance;
    includePermissionsInfo?: boolean;
}): z.infer<typeof schema> => {
    const {model} = collection;

    return {
        ...collectionModel.format(model),
        permissions: includePermissionsInfo ? collection.permissions : undefined,
    };
};

export const collectionInstance = {
    schema,
    format,
};
