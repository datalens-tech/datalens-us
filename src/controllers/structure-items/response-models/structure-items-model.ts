import {z} from '../../../components/zod';
import {CollectionInstance} from '../../../registry/plugins/common/entities/collection/types';
import {SharedEntryInstance} from '../../../registry/plugins/common/entities/shared-entry/types';
import {
    isSharedEntryInstance,
    isWorkbookInstance,
} from '../../../registry/plugins/common/entities/structure-item/types';
import {WorkbookInstance} from '../../../registry/plugins/common/entities/workbook/types';
import Utils from '../../../utils';
import {collectionInstance} from '../../collections/response-models';
import {workbookInstance} from '../../workbooks/response-models';

import {sharedEntryInstance} from './structure-shared-entry-instance';

const schema = z
    .object({
        items: collectionInstance.schema
            .merge(z.object({entity: z.literal('collection')}))
            .or(workbookInstance.schema.merge(z.object({entity: z.literal('workbook')})))
            .or(sharedEntryInstance.schema.merge(z.object({entity: z.literal('entry')})))
            .array(),
        nextPageToken: z.string().nullable(),
    })
    .describe('Structure items model');

export type StructureItemsModel = z.infer<typeof schema>;

const format = async (data: {
    items: (CollectionInstance | WorkbookInstance | SharedEntryInstance)[];
    nextPageToken: Nullable<string>;
}): Promise<StructureItemsModel> => {
    return {
        items: await Utils.macrotasksMap(
            data.items,
            (structureItem: CollectionInstance | WorkbookInstance | SharedEntryInstance) => {
                if (isSharedEntryInstance(structureItem)) {
                    return {
                        ...sharedEntryInstance.format(structureItem),
                        entity: 'entry' as const,
                    };
                } else if (isWorkbookInstance(structureItem)) {
                    return {
                        ...workbookInstance.format(structureItem),
                        entity: 'workbook' as const,
                    };
                } else {
                    return {
                        ...collectionInstance.format(structureItem),
                        entity: 'collection' as const,
                    };
                }
            },
        ),
        nextPageToken: data.nextPageToken,
    };
};

export const structureItemsModel = {
    schema,
    format,
};
