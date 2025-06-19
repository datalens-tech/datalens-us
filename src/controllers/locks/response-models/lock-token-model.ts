import {z} from '../../../components/zod';
import Lock from '../../../db/models/lock';

const schema = z
    .object({
        lockToken: z.string(),
    })
    .describe('Lock token response');

export type LockTokenModel = z.infer<typeof schema>;

const format = (data: Pick<Lock, 'lockToken'>): LockTokenModel => {
    return {
        lockToken: data.lockToken,
    };
};

export const lockTokenModel = {
    schema,
    format,
};
