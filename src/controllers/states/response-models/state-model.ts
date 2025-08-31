import {z} from '../../../components/zod';
import {State} from '../../../db/models/new/state';
import Utils from '../../../utils';

const schema = z
    .object({
        hash: z.string(),
        entryId: z.string(),
        data: z.record(z.string(), z.unknown()).nullable(),
        createdAt: z.string(),
    })
    .describe('State model');

const format = (data: State): z.infer<typeof schema> => {
    return {
        hash: data.hash,
        entryId: Utils.encodeId(data.entryId),
        data: data.data,
        createdAt: data.createdAt,
    };
};

export const stateModel = {
    schema,
    format,
};
