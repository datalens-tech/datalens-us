import {z} from '../../../components/zod';
import {State} from '../../../db/models/new/state';

const schema = z
    .object({
        hash: z.string(),
    })
    .describe('State hash model');

const format = (data: State): z.infer<typeof schema> => {
    return {
        hash: data.hash,
    };
};

export const stateHashModel = {
    schema,
    format,
};
