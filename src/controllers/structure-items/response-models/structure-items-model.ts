import {z} from '../../../components/zod';
import {CollectionInstance} from '../../../registry/common/entities/collection/types';
import {isWorkbookInstance} from '../../../registry/common/entities/structure-item/types';
import {WorkbookInstance} from '../../../registry/common/entities/workbook/types';
import Utils from '../../../utils';
import {collectionInstance} from '../../collections/response-models';
import {workbookInstance} from '../../workbooks/response-models';

const schema = z
    .object({
        items: collectionInstance.schema.or(workbookInstance.schema).array(),
        nextPageToken: z.string().nullable(),
    })
    .describe('Structure items model');

export type StructureItemsModel = z.infer<typeof schema>;

const format = async (data: {
    items: (CollectionInstance | WorkbookInstance)[];
    nextPageToken: Nullable<string>;
}) => {
    return {
        items: await Utils.macrotasksMap(
            data.items,
            (structureItem: CollectionInstance | WorkbookInstance) =>
                isWorkbookInstance(structureItem)
                    ? workbookInstance.format(structureItem)
                    : collectionInstance.format(structureItem),
        ),
        nextPageToken: data.nextPageToken,
    };
};

export const structureItemsModel = {
    schema,
    format,
};
