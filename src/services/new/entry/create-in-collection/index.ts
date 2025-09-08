import {AppError} from '@gravity-ui/nodekit';
import {transaction} from 'objection';

import {BiTrackingLogs, RETURN_COLUMNS, US_ERRORS} from '../../../../const';
import LegacyEntry from '../../../../db/models/entry';
import {EntryColumn, Entry as EntryModel} from '../../../../db/models/new/entry';
import {RevisionModel, RevisionModelColumn} from '../../../../db/models/new/revision';
import {Operation} from '../../../../entities/types';
import {UsPermission} from '../../../../types/models';
import Utils, {makeUserId} from '../../../../utils';
import {getParentIds} from '../../collection/utils/get-parents';
import {ServiceArgs} from '../../types';
import {getPrimary} from '../../utils/get-trx';

import {CreateEntryInCollectionArgs, parseArgs} from './validate';

export async function createEntryInCollection(
    {ctx, trx}: ServiceArgs,
    args: CreateEntryInCollectionArgs,
) {
    ctx.log('CREATE_ENTRY_IN_COLLECTION');

    const {
        collectionId,
        scope,
        name,
        type = '',
        links,
        hidden,
        mirrored,
        mode = 'save',
        unversionedData,
        meta,
        data,
        includePermissionsInfo,
        description,
        annotation,
    } = await parseArgs(args);

    const registry = ctx.get('registry');
    const {getId} = registry.getDbInstance();
    const {tenantId, isPrivateRoute, user} = ctx.get('info');
    const createdBy = makeUserId(user.userId);

    const {accessServiceEnabled, accessBindingsServiceEnabled} = ctx.config;

    const parentIds = await getParentIds({
        ctx,
        trx,
        collectionId,
    });

    if (parentIds.length === 0) {
        throw new AppError(`Cannot find parent collection with id – ${collectionId}`, {
            code: US_ERRORS.COLLECTION_NOT_EXISTS,
        });
    }

    let operation: Operation | undefined;

    const createdEntry = await transaction(getPrimary(trx), async (transactionTrx) => {
        const [entryId, revId] = await Promise.all([getId(), getId()]);

        const displayKey = `${entryId}/${name}`;
        const key = displayKey.toLowerCase();

        const syncedLinks = await LegacyEntry.syncLinks({
            entryId,
            links,
            ctx,
            trxOverride: transactionTrx,
        });

        const newData = {
            collectionId,
            entryId,
            savedId: revId,
            key,
            displayKey,
            tenantId,
            scope,
            type,
            innerMeta: null,
            unversionedData,
            createdBy: createdBy,
            updatedBy: createdBy,
            deletedAt: null,
            hidden,
            mirrored,
            ...(mode === 'publish' ? {publishedId: revId} : {}),
        };

        await EntryModel.query(transactionTrx)
            .insert(newData)
            .timeout(EntryModel.DEFAULT_QUERY_TIMEOUT);

        await RevisionModel.query(transactionTrx)
            .insert({
                revId,
                entryId,
                meta,
                data,
                links: syncedLinks,
                createdBy: createdBy,
                updatedBy: createdBy,
                ...(typeof description === 'string' ? {annotation: {description}} : {}),
                ...(typeof annotation?.description === 'string'
                    ? {annotation: {description: annotation.description}}
                    : {}),
            })
            .timeout(RevisionModel.DEFAULT_QUERY_TIMEOUT);

        const model = await EntryModel.query(transactionTrx)
            .select(RETURN_COLUMNS.concat(RevisionModelColumn.Links))
            .join(
                RevisionModel.tableName,
                `${EntryModel.tableName}.${EntryColumn.EntryId}`,
                `${RevisionModel.tableName}.${RevisionModelColumn.EntryId}`,
            )
            .where({
                [`${EntryModel.tableName}.${EntryColumn.EntryId}`]: entryId,
                [`${EntryModel.tableName}.${EntryColumn.IsDeleted}`]: false,
            })
            .first()
            .timeout(EntryModel.DEFAULT_QUERY_TIMEOUT);

        const {SharedEntry} = registry.common.classes.get();

        const sharedEntry = new SharedEntry({
            ctx,
            model: model!,
        });

        if (accessServiceEnabled && accessBindingsServiceEnabled && !isPrivateRoute) {
            operation = await sharedEntry.register({
                parentIds,
            });
        }

        return model!;
    });

    const resultEntry: EntryModel & {permissions?: UsPermission; operation?: Operation} =
        createdEntry;

    resultEntry.operation = operation;

    if (includePermissionsInfo) {
        resultEntry.permissions = {
            execute: true,
            read: true,
            edit: true,
            admin: true,
        };
    }

    ctx.log(BiTrackingLogs.CreateEntry, {
        entryId: Utils.encodeId(resultEntry.entryId),
    });

    return resultEntry;
}
