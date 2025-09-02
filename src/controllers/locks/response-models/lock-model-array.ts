import {z} from '../../../components/zod';
import Lock from '../../../db/models/lock';
import Utils from '../../../utils';

import {lockModel} from './lock-model';

const schema = lockModel.schema.array().describe('Lock model array');

const format = async (data: Lock[]): Promise<z.infer<typeof schema>> => {
    return await Utils.macrotasksMap(data, lockModel.format);
};

export const locksModelArray = {
    schema,
    format,
};
