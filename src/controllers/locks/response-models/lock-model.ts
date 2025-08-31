import {z} from '../../../components/zod';
import Lock from '../../../db/models/lock';
import Utils from '../../../utils';

const schema = z
    .object({
        lockId: z.string(),
        entryId: z.string(),
        lockToken: z.string(),
        expiryDate: z.string(),
        startDate: z.string(),
        login: z.string().nullable(),
    })
    .describe('Lock model');

const format = (data: Lock): z.infer<typeof schema> => {
    return {
        lockId: Utils.encodeId(data.lockId),
        entryId: Utils.encodeId(data.entryId),
        lockToken: data.lockToken,
        expiryDate: data.expiryDate,
        startDate: data.startDate,
        login: data.login,
    };
};

export const lockModel = {
    schema,
    format,
};
