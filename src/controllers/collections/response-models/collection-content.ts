import {z} from '../../../components/zod';
import type {CollectionInstance} from '../../../registry/common/entities/collection/types';
import type {WorkbookInstance} from '../../../registry/common/entities/workbook/types';
import Utils from '../../../utils';
import {workbookInstance} from '../../workbooks/response-models/workbook-instance';

import {collectionInstance} from './collection-instance';

const schema = z
    .object({
        collections: collectionInstance.schema.array(),
        workbooks: workbookInstance.schema.array(),
        collectionsNextPageToken: z.string().nullable(),
        workbooksNextPageToken: z.string().nullable(),
    })
    .describe('Collection content');

const format = async ({
    collections,
    workbooks,
    collectionsNextPageToken,
    workbooksNextPageToken,
}: {
    collections: CollectionInstance[];
    workbooks: WorkbookInstance[];
    collectionsNextPageToken: Nullable<string>;
    workbooksNextPageToken: Nullable<string>;
}): Promise<z.infer<typeof schema>> => {
    return {
        collections: await Utils.macrotasksMap(collections, collectionInstance.format),
        workbooks: await Utils.macrotasksMap(workbooks, workbookInstance.format),
        collectionsNextPageToken,
        workbooksNextPageToken,
    };
};

export const collectionContent = {
    schema,
    format,
};
