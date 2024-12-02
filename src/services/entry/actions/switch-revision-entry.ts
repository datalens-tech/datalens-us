import {AppError} from '@gravity-ui/nodekit';
import {raw} from 'objection';

import {makeSchemaValidator} from '../../../components/validation-schema-compiler';
import {CURRENT_TIMESTAMP, DEFAULT_QUERY_TIMEOUT, SYSTEM_USER, US_ERRORS} from '../../../const';
import Entry from '../../../db/models/entry';
import {EntryColumn} from '../../../db/models/new/entry';
import {RevisionModelColumn} from '../../../db/models/new/revision';
import Revision from '../../../db/models/revision';
import Utils, {makeUserId} from '../../../utils';
import {ServiceArgs} from '../../new/types';
import {getPrimary, getReplica} from '../../new/utils';

const validateArgs = makeSchemaValidator({
    type: 'object',
    required: ['entryId', 'revId'],
    properties: {
        entryId: {
            type: 'string',
        },
        revId: {
            type: 'string',
        },
    },
});

export type SwitchRevisionEntryData = {
    entryId: string;
    revId: string;
};

export async function switchRevisionEntry(
    {ctx, trx, skipValidation = false}: ServiceArgs,
    args: SwitchRevisionEntryData,
) {
    const {entryId, revId} = args;

    ctx.log('SWITCH_REVISION_ENTRY_REQUEST', {
        entryId: Utils.encodeId(entryId),
        revId: Utils.encodeId(revId),
    });

    if (!skipValidation) {
        validateArgs(args);
    }

    const replica = getReplica(trx);

    const entry = await Entry.query(replica)
        .select()
        .where({
            [EntryColumn.EntryId]: entryId,
            [EntryColumn.IsDeleted]: false,
        })
        .first()
        .timeout(DEFAULT_QUERY_TIMEOUT);

    if (!entry) {
        throw new AppError(US_ERRORS.NOT_EXIST_ENTRY, {
            code: US_ERRORS.NOT_EXIST_ENTRY,
        });
    }

    const revision = await Revision.query(replica)
        .select()
        .where({[RevisionModelColumn.RevId]: revId})
        .andWhere({[RevisionModelColumn.EntryId]: entryId})
        .first()
        .timeout(DEFAULT_QUERY_TIMEOUT);

    if (!revision) {
        throw new AppError(US_ERRORS.NOT_EXIST_REVISION, {
            code: US_ERRORS.NOT_EXIST_REVISION,
        });
    }

    const updatedBy = makeUserId(SYSTEM_USER.ID);

    await Entry.query(getPrimary(trx))
        .patch({
            [EntryColumn.SavedId]: revId,
            [EntryColumn.PublishedId]: revId,
            [EntryColumn.UpdatedAt]: raw(CURRENT_TIMESTAMP),
            [EntryColumn.UpdatedBy]: updatedBy,
        })
        .where({
            [EntryColumn.EntryId]: entryId,
        })
        .timeout(DEFAULT_QUERY_TIMEOUT);

    ctx.log('SWITCH_REVISION_ENTRY_SUCCESS');

    return {
        isSuccess: true,
    };
}
