import {z} from '../../../components/zod';
import {EntryScope} from '../../../db/models/new/entry/types';
import {JoinedEntryRevisionColumns} from '../../../db/presentations/joined-entry-revision';

const schema = z
    .object({
        accessDescription: z.string().nullable(),
    })
    .describe('Entry access description model');

const format = (joinedEntryRevision: JoinedEntryRevisionColumns): z.infer<typeof schema> => {
    let accessDescription: string | null = null;

    const dataAccessDescription = joinedEntryRevision.data?.accessDescription;

    if (
        joinedEntryRevision.scope === EntryScope.Dash &&
        typeof dataAccessDescription === 'string' &&
        dataAccessDescription
    ) {
        accessDescription = dataAccessDescription;
    }

    return {
        accessDescription,
    };
};

export const entryAccessDescriptionModel = {
    schema,
    format,
};
