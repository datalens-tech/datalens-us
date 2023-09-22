import {EmbedModel} from '../../../db/models/new/embed';

export const checkEntryIdInEmbed = ({entryId, embed}: {entryId: string; embed: EmbedModel}) => {
    let result = true;

    const allowedEntryIds = [embed.entryId];
    if (embed.depsIds) {
        allowedEntryIds.push(...embed.depsIds);
    }

    if (!allowedEntryIds.includes(entryId)) {
        result = false;
    }

    return result;
};
