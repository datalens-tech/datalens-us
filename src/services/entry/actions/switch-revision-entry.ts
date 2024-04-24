import {AppError} from '@gravity-ui/nodekit';
import {raw} from 'objection';
import {makeSchemaValidator} from '../../../components/validation-schema-compiler';
import Entry from '../../../db/models/entry';
import {CURRENT_TIMESTAMP, DEFAULT_QUERY_TIMEOUT, US_ERRORS} from '../../../const';
import Utils, {logInfo} from '../../../utils';
import {ServiceArgs} from '../../new/types';
import Revision from '../../../db/models/revision';
import {RevisionModelColumn} from '../../../db/models/new/revision';
import {EntryColumn} from '../../../db/models/new/entry';

const validateArgs = makeSchemaValidator({
    type: 'object',
    required: ['entryId', 'publishedId', 'savedId'],
    properties: {
        entryId: {
            type: 'string',
        },
        publishedId: {
            type: 'string',
        },
        savedId: {
            type: 'string',
        },
    },
});

export type SwitchRevisionEntryData = {
    entryId: string;
    savedId: string;
    publishedId: string;
};

export async function switchRevisionEntry(
    {ctx, skipValidation = false}: ServiceArgs,
    args: SwitchRevisionEntryData,
) {
    const {entryId, publishedId, savedId} = args;

    logInfo(ctx, 'SWITCH_REVISION_ENTRY_REQUEST', {
        entryId: Utils.encodeId(entryId),
        publishedId: Utils.encodeId(publishedId),
        savedId: Utils.encodeId(savedId),
    });

    if (!skipValidation) {
        validateArgs(args);
    }

    const entry = await Entry.query(Entry.replica)
        .select()
        .where({[EntryColumn.EntryId]: entryId})
        .first()
        .timeout(DEFAULT_QUERY_TIMEOUT);

    if (!entry) {
        throw new AppError(US_ERRORS.NOT_EXIST_ENTRY, {
            code: US_ERRORS.NOT_EXIST_ENTRY,
        });
    }

    const revision = await Revision.query()
        .select()
        .where({[RevisionModelColumn.RevId]: publishedId})
        .orWhere({[RevisionModelColumn.RevId]: savedId})
        .andWhere({[RevisionModelColumn.EntryId]: entryId})
        .first()
        .timeout(DEFAULT_QUERY_TIMEOUT);

    if (!revision) {
        throw new AppError(US_ERRORS.NOT_EXIST_REVISION, {
            code: US_ERRORS.NOT_EXIST_REVISION,
        });
    }

    await Entry.query(Entry.primary)
        .patch({
            [EntryColumn.SavedId]: savedId,
            [EntryColumn.PublishedId]: publishedId,
            updatedAt: raw(CURRENT_TIMESTAMP),
        })
        .where({
            [EntryColumn.EntryId]: entryId,
        })
        .timeout(DEFAULT_QUERY_TIMEOUT);

    ctx.log('SWITCH_REVISION_ENTRY_SUCCESS');
}
