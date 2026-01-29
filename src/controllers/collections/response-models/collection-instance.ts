import {z} from '../../../components/zod';
import type {CollectionInstance} from '../../../registry/plugins/common/entities/collection/types';

import {collectionModel} from './collection-model';

const schema = collectionModel.schema
    .merge(
        z.object({
            permissions: z
                .object({
                    listAccessBindings: z.boolean(),
                    updateAccessBindings: z.boolean(),
                    createCollection: z.boolean(),
                    createWorkbook: z.boolean(),
                    limitedView: z.boolean(),
                    view: z.boolean(),
                    update: z.boolean(),
                    copy: z.boolean(),
                    move: z.boolean(),
                    delete: z.boolean(),
                })
                .optional(),
        }),
    )
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
