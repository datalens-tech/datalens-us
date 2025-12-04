import {z} from '../../../components/zod';
import Utils from '../../../utils';

const schema = z.record(z.string(), z.boolean()).describe('Check entries existence response model');

type FormatParams = {
    existing: Set<string>;
    decodedEntryIds: string[];
    invalidEntryIds: string[];
};

const format = async ({
    existing,
    decodedEntryIds,
    invalidEntryIds,
}: FormatParams): Promise<z.infer<typeof schema>> => {
    const response: Record<string, boolean> = {};

    await Utils.macrotasksMap(decodedEntryIds, (id) => {
        const encodedId = Utils.encodeId(id);
        response[encodedId] = existing.has(id);
    });

    invalidEntryIds.forEach((id) => {
        response[id] = false;
    });

    return response;
};

export const checkEntriesExistenceModel = {
    schema,
    format,
};
