import {JoinedEntryRevisionColumns} from '../../../../db/presentations/joined-entry-revision';

import {formatGetEntryMetaResponse} from './format-get-entry-meta-response';

export const formatGetEntryMetaPrivateResponse = ({
    entryMeta,
    statusCode,
}: {
    entryMeta: JoinedEntryRevisionColumns;
    statusCode?: number;
}) => {
    return {
        ...formatGetEntryMetaResponse(entryMeta),
        statusCode,
    };
};
