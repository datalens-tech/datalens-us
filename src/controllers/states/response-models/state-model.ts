import {z} from '../../../components/zod';
import {State} from '../../../db/models/new/state';
import Utils from '../../../utils';

const schema = z
    .object({
        stateId: z.string(),
        hash: z.string(),
        createdAt: z.string(),
        updatedAt: z.string(),
    })
    .describe('State model');

export type StateModel = z.infer<typeof schema>;

const format = (data: State) => {
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
