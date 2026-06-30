import {transaction} from 'objection';

import {CollectionNotExistsError} from '../../../../components/errors';
import {BiTrackingLogs, RETURN_COLUMNS} from '../../../../const';
import LegacyEntry from '../../../../db/models/entry';
import {EntryColumn, Entry as EntryModel} from '../../../../db/models/new/entry';
import {RevisionModel, RevisionModelColumn} from '../../../../db/models/new/revision';
import {Operation} from '../../../../entities/types';
import {UsPermission} from '../../../../types/models';
import Utils, {makeUserId} from '../../../../utils';
import {getParentIds} from '../../collection/utils/get-parents';
import {ServiceArgs} from '../../types';
import {getPrimary} from '../../utils/get-trx';
import {createCollectionEntry} from '../collection-entry';

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
        version,
        sourceVersion,
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
        throw new CollectionNotExistsError({
            message: `Cannot find parent collection with id – ${Utils.encodeId(collectionId)}`,
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
                version,
                sourceVersion,
            })
            .timeout(RevisionModel.DEFAULT_QUERY_TIMEOUT);

        const model = await EntryModel.query(transactionTrx)
            .select([...RETURN_COLUMNS, RevisionModelColumn.Links])
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

        if (accessServiceEnabled && accessBindingsServiceEnabled && !isPrivateRoute) {
            const collectionEntry = createCollectionEntry(ctx, model!);

            operation = await collectionEntry.register({parentIds});
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
