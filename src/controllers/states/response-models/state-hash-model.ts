import {z} from '../../../components/zod';
import {State} from '../../../db/models/new/state';

const schema = z
    .object({
        hash: z.string(),
    })
    .describe('State hash model');

export type StateHashModel = z.infer<typeof schema>;

const format = (data: State): StateHashModel => {
    return {
        hash: data.hash,
    };
};
export const stateHashModel = {
    schema,
    format,
};
