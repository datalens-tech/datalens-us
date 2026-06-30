import {z} from '../../../components/zod';
import {RenamedEntry} from '../../../services/entry/actions/rename-entry';
import Utils from '../../../utils';

import {entryReturnColumnsModel} from './entry-return-columns-model';

const schema = z.array(entryReturnColumnsModel.schema).describe('Rename entry model');

const format = async (data: RenamedEntry[]): Promise<z.infer<typeof schema>> =>
    Utils.macrotasksMap(data, entryReturnColumnsModel.format);

export const renameEntryModel = {schema, format};
