import {z} from '../../../components/zod';
import Lock from '../../../db/models/lock';
import Utils from '../../../utils';

import {lockEntryModel} from './lock-entry-model';

const schema = lockEntryModel.schema.array().nullable();

export type LocksModel = z.infer<typeof schema>;

const format = async (data: Lock[]): Promise<LocksModel> => {
    return await Utils.macrotasksMap(data, lockEntryModel.format);
};

export const locksModel = {
    schema,
    format,
};
