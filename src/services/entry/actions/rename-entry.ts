import {AppError} from '@gravity-ui/nodekit';
import {raw, transaction} from 'objection';

import {makeSchemaValidator} from '../../../components/validation-schema-compiler';
import {
    BiTrackingLogs,
    CURRENT_TIMESTAMP,
    EXTENDED_QUERY_TIMEOUT,
    RETURN_COLUMNS,
    US_ERRORS,
} from '../../../const';
import Entry from '../../../db/models/entry';
import {WorkbookPermission} from '../../../entities/workbook';
import {CTX, DlsActions} from '../../../types/models';
import Utils, {makeUserId} from '../../../utils';
import {getWorkbook} from '../../new/workbook/get-workbook';
import {checkWorkbookPermission} from '../../new/workbook/utils';

import {checkEntry} from './check-entry';

const validateRenameEntry = makeSchemaValidator({
    type: 'object',
    required: ['entryId', 'name'],
    properties: {
        entryId: {
            type: 'string',
        },
        name: {
            type: 'string',
            verifyEntryName: true,
        },
    },
});

type RenameEntryData = {
    entryId: string;
    name: string;
};

export const renameEntry = async (ctx: CTX, renameEntryData: RenameEntryData) => {
    validateRenameEntry(renameEntryData);

    const {entryId, name} = renameEntryData;

    ctx.log('RENAME_ENTRY_REQUEST', {
        entryId: Utils.encodeId(entryId),
        name,
    });

    const registry = ctx.get('registry');
    const {DLS} = registry.common.classes.get();

    const {accessServiceEnabled} = ctx.config;
    const {tenantId, isPrivateRoute, user} = ctx.get('info');
    const updatedBy = makeUserId(user.userId);

    const result = await transaction(Entry.primary, async (trx) => {
        const renamingEntry = await Entry.query(trx)
            .where({
                entryId,
                isDeleted: false,
            })
            .first()
            .timeout(Entry.DEFAULT_QUERY_TIMEOUT);

        if (!renamingEntry) {
            throw new AppError(US_ERRORS.NOT_EXIST_ENTRY, {
                code: US_ERRORS.NOT_EXIST_ENTRY,
            });
        }

        if (Utils.isUsersFolder(renamingEntry.key)) {
            throw new AppError("Folder 'Users' cannot be renamed", {
                code: US_ERRORS.MODIFY_USERS_FOLDER_DENIED,
            });
        }

        if (!renamingEntry.workbookId) {
            await checkEntry(ctx, trx, {verifiableEntry: renamingEntry});
        }

        if (renamingEntry.workbookId) {
            if (!isPrivateRoute) {
                const workbook = await getWorkbook(
                    {ctx, trx: Entry.replica},
                    {workbookId: renamingEntry.workbookId},
                );

                if (accessServiceEnabled) {
                    await checkWorkbookPermission({
                        ctx,
                        trx,
                        workbook,
                        permission: WorkbookPermission.Update,
                    });
                }
            }
        } else if (!isPrivateRoute && ctx.config.dlsEnabled) {
            await DLS.checkPermission(
                {ctx, trx},
                {
                    entryId,
                    action: DlsActions.Edit,
                },
            );
        }

        const isFolder = Utils.isFolder({scope: renamingEntry.scope});

        const oldEntryDisplayKey = renamingEntry.displayKey;

        const oldEntryKey = renamingEntry.key;

        let parentFolderDisplayKey = Utils.getParentFolderKey({
            keyFormatted: oldEntryDisplayKey,
        });

        if (Utils.isRoot(parentFolderDisplayKey)) {
            parentFolderDisplayKey = '';
        }

        const newEntryDisplayKey = `${parentFolderDisplayKey}${name}${isFolder ? '/' : ''}`;
        const newEntryKey = newEntryDisplayKey.toLowerCase();

        const renamingEntries = await Entry.query(trx)
            .patch({
                key: raw(`? || substr(key, ?)`, [newEntryKey, oldEntryKey.length + 1]),
                displayKey: raw(`? || substr(display_key, ?)`, [
                    newEntryDisplayKey,
                    oldEntryDisplayKey.length + 1,
                ]),
                updatedBy,
                updatedAt: raw(CURRENT_TIMESTAMP),
            })
            .where('key', 'like', `${Utils.escapeStringForLike(oldEntryKey)}${isFolder ? '%' : ''}`)
            .where({tenantId})
            .returning('*')
            .timeout(isFolder ? EXTENDED_QUERY_TIMEOUT : Entry.DEFAULT_QUERY_TIMEOUT);

        return await Entry.query(trx)
            .select(RETURN_COLUMNS)
            .leftJoin(
                'revisions',
                'revisions.revId',
                raw('coalesce(entries.published_id, entries.saved_id)'),
            )
            .where({
                isDeleted: false,
            })
            .whereIn(
                'entries.entryId',
                renamingEntries.map((entry) => entry.entryId),
            )
            .timeout(Entry.DEFAULT_QUERY_TIMEOUT);
    });

    ctx.log(BiTrackingLogs.RenameEntry, {
        entryId: Utils.encodeId(entryId),
    });
    return result;
};
