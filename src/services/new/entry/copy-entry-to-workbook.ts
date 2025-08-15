import {AppError} from '@gravity-ui/nodekit';
import {transaction} from 'objection';

import {makeSchemaValidator} from '../../../components/validation-schema-compiler';
import {BiTrackingLogs, US_ERRORS} from '../../../const';
import OldEntry from '../../../db/models/entry';
import {Entry} from '../../../db/models/new/entry';
import {EntryScope} from '../../../db/models/new/entry/types';
import {RevisionModel, RevisionModelColumn} from '../../../db/models/new/revision';
import {WorkbookPermission} from '../../../entities/workbook';
import {SyncLinks} from '../../../types/models/link';
import Utils, {makeUserId} from '../../../utils';
import {ServiceArgs} from '../../new/types';
import {checkWorkbookPermission} from '../../new/workbook/utils/check-workbook-permission';
import {getPrimary} from '../utils';
import {getWorkbook} from '../workbook';

const validateCopyEntryToWorkbook = makeSchemaValidator({
    type: 'object',
    required: ['entryId'],
    properties: {
        entryId: {
            type: 'string',
        },
        workbookId: {
            type: 'string',
        },
        name: {
            type: 'string',
            verifyEntryName: true,
        },
    },
});

export type CopyEntryToWorkbookArgs = {
    entryId: string;
    workbookId?: string;
    name?: string;
};

export const copyEntryToWorkbook = async (
    {ctx, trx, skipValidation = false, skipCheckPermissions = false}: ServiceArgs,
    args: CopyEntryToWorkbookArgs,
) => {
    const {entryId, workbookId, name} = args;

    const {accessServiceEnabled} = ctx.config;
    const {tenantId, user, isPrivateRoute} = ctx.get('info');
    const registry = ctx.get('registry');
    const {getId} = registry.getDbInstance();

    const copiedBy = makeUserId(user.userId);

    const checkPermissionsEnabled =
        accessServiceEnabled && !isPrivateRoute && !skipCheckPermissions;

    ctx.log('COPY_ENTRY_TO_WORKBOOK_START', {
        entryId: Utils.encodeId(entryId),
        workbookId: Utils.encodeId(workbookId),
        name,
        copiedBy,
    });

    if (!skipValidation) {
        validateCopyEntryToWorkbook(args);
    }

    const result = await transaction(getPrimary(trx), async (transactionTrx) => {
        const copingEntry = await Entry.query(transactionTrx)
            .where({
                entryId,
                tenantId,
                isDeleted: false,
            })
            .first()
            .timeout(Entry.DEFAULT_QUERY_TIMEOUT);

        if (!copingEntry) {
            throw new AppError(US_ERRORS.NOT_EXIST_ENTRY, {
                code: US_ERRORS.NOT_EXIST_ENTRY,
            });
        }

        if (copingEntry.workbookId === null) {
            throw new AppError(US_ERRORS.ENTRY_IS_NOT_IN_WORKBOOK, {
                code: US_ERRORS.ENTRY_IS_NOT_IN_WORKBOOK,
            });
        }

        if (copingEntry.scope === EntryScope.Connection) {
            const fileConnectionExists = Utils.checkFileConnectionsExistence([copingEntry]);

            if (fileConnectionExists) {
                throw new AppError(US_ERRORS.WORKBOOK_COPY_FILE_CONNECTION_ERROR, {
                    code: US_ERRORS.WORKBOOK_COPY_FILE_CONNECTION_ERROR,
                });
            }
        }

        ctx.log('GET_ENTRY_MODEL');

        if (checkPermissionsEnabled) {
            ctx.log('CHECK_ACCESS_TO_ORIGIN_WORKBOOK');

            const originWorkbook = await getWorkbook(
                {
                    ctx,
                    trx: transactionTrx,
                    skipValidation: true,
                    skipCheckPermissions: true,
                },
                {workbookId: copingEntry.workbookId},
            );

            await checkWorkbookPermission({
                ctx,
                trx: transactionTrx,
                workbook: originWorkbook,
                permission: WorkbookPermission.Update,
            });
        }

        let targetWorkbookId: string;
        if (workbookId) {
            targetWorkbookId = workbookId;
        } else {
            targetWorkbookId = copingEntry.workbookId;
        }

        ctx.log('GET_TARGET_WORKBOOK_ID', {
            targetWorkbookId: Utils.encodeId(targetWorkbookId),
        });

        if (checkPermissionsEnabled && copingEntry.workbookId !== targetWorkbookId) {
            ctx.log('CHECK_ACCESS_TO_TARGET_WORKBOOK');

            const workbook = await getWorkbook(
                {
                    ctx,
                    trx: transactionTrx,
                    skipValidation: true,
                    skipCheckPermissions: true,
                },
                {workbookId: targetWorkbookId},
            );

            await checkWorkbookPermission({
                ctx,
                trx: transactionTrx,
                workbook,
                permission: WorkbookPermission.Update,
            });
        }

        const copingRevision = await RevisionModel.query(transactionTrx)
            .where({
                [RevisionModelColumn.EntryId]: copingEntry.entryId,
                [RevisionModelColumn.RevId]: copingEntry.publishedId
                    ? copingEntry.publishedId
                    : copingEntry.savedId,
            })
            .first()
            .timeout(Entry.DEFAULT_QUERY_TIMEOUT);

        if (!copingRevision) {
            throw new AppError(US_ERRORS.NOT_EXIST_REVISION, {
                code: US_ERRORS.NOT_EXIST_REVISION,
            });
        }

        ctx.log('GET_TARGET_REVISION', {
            targetRevisionId: Utils.encodeId(copingRevision.revId),
        });

        const [newEntryId, newRevisionId] = await Promise.all([getId(), getId()]);

        const syncedLinks = await OldEntry.syncLinks({
            ctx,
            trxOverride: transactionTrx,
            entryId: newEntryId,
            links: copingRevision.links as SyncLinks,
        });

        const displayKey = `${newEntryId}/${name ?? copingEntry.name}`;
        const key = displayKey.toLowerCase();

        const newEntry = await Entry.query(transactionTrx).insert({
            entryId: newEntryId,
            savedId: newRevisionId,
            publishedId: copingEntry.publishedId ? newRevisionId : null,
            key,
            displayKey,
            tenantId,
            scope: copingEntry.scope,
            type: copingEntry.type,
            innerMeta: null,
            unversionedData: copingEntry.unversionedData,
            hidden: copingEntry.hidden,
            createdBy: copiedBy,
            updatedBy: copiedBy,
            workbookId: targetWorkbookId,
        });

        ctx.log('CREATE_NEW_ENTRY', {newEntryId: Utils.encodeId(newEntryId)});

        await RevisionModel.query(transactionTrx).insert({
            revId: newRevisionId,
            entryId: newEntryId,
            meta: copingRevision.meta,
            data: copingRevision.data,
            annotation: copingRevision.annotation,
            links: syncedLinks,
            createdBy: copiedBy,
            updatedBy: copiedBy,
        });

        ctx.log('CREATE_NEW_REVISION', {newRevisionId: Utils.encodeId(newRevisionId)});

        return newEntry;
    });

    ctx.log('COPY_ENTRY_TO_WORKBOOK_FINISH');

    ctx.log(BiTrackingLogs.CopyEntry, {
        entryId: Utils.encodeId(entryId),
    });

    return result;
};
