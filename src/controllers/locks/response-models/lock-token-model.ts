import {z} from '../../../components/zod';
import Lock from '../../../db/models/lock';

const schema = z
    .object({
        lockToken: z.string(),
    })
    .describe('Lock token');

export type LockTokenModel = z.infer<typeof schema>;

const format = (data: Pick<Lock, 'lockToken'>): z.infer<typeof schema> => {
    return {
        lockToken: data.lockToken,
    };
};

export const lockTokenModel = {
    schema,
    format,
};
