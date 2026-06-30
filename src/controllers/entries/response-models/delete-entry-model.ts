import {z} from '../../../components/zod';
import {DeletedEntry} from '../../../services/entry/actions/delete-entry';

import {entryReturnColumnsModel} from './entry-return-columns-model';

const schema = z
    .object({
        ...entryReturnColumnsModel.schema.shape,
        isDeleted: z.boolean(),
        deletedAt: z.string().nullable(),
    })
    .describe('Delete entry model');

const format = (data: DeletedEntry): z.infer<typeof schema> => ({
    ...entryReturnColumnsModel.format(data),
    isDeleted: data.isDeleted,
    deletedAt: data.deletedAt,
});

export const deleteEntryModel = {schema, format};
