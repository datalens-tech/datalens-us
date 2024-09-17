import {transaction} from 'objection';
import Entry from '../../../db/models/entry';
import Revision from '../../../db/models/revision';
import {
    CTX,
    WorkbookColumns,
    EntryScope,
    SyncLinks,
    EntryColumns,
    RevisionColumns,
    UsPermission,
    Mode,
} from '../../../types/models';
import {makeSchemaValidator} from '../../../components/validation-schema-compiler';
import {
    AJV_PATTERN_KEYS_NOT_OBJECT,
    DEFAULT_QUERY_TIMEOUT,
    RETURN_COLUMNS,
    BiTrackingLogs,
    ModeValues,
} from '../../../const';
import {getWorkbook} from '../../new/workbook/get-workbook';
import {checkWorkbookPermission, getEntryPermissionsByWorkbook} from '../../new/workbook/utils';
import {WorkbookPermission} from '../../../entities/workbook';
import Utils, {makeUserId} from '../../../utils';
import {getId} from '../../../db';

export const validateCreateEntryInWorkbook = makeSchemaValidator({
    type: 'object',
    required: ['workbookId', 'name', 'scope'],
    properties: {
        workbookId: {
            type: 'string',
        },
        name: {
            type: 'string',
            verifyEntryName: true,
        },
        scope: {
            type: 'string',
            enum: ['connection', 'dataset', 'dash', 'widget', 'presentation', 'report'],
        },
        type: {
            type: 'string',
        },
        hidden: {
            type: 'boolean',
        },
        mirrored: {
            type: 'boolean',
        },
        mode: {
            type: 'string',
            enum: ModeValues,
        },
        meta: {
            type: ['object', 'null'],
            patternProperties: AJV_PATTERN_KEYS_NOT_OBJECT,
            restrictMetaSize: true,
        },
        links: {
            type: 'object',
            patternProperties: AJV_PATTERN_KEYS_NOT_OBJECT,
        },
        data: {
            type: ['object', 'null'],
        },
        unversionedData: {
            type: ['object', 'null'],
            restrictUnversionedDataSize: true,
        },
        includePermissionsInfo: {
            type: 'boolean',
        },
    },
});

export type CreateEntryInWorkbookData = {
    workbookId: WorkbookColumns['workbookId'];
    scope: EntryScope;
    name: string;
    type?: EntryColumns['type'];
    links?: SyncLinks;
    hidden?: EntryColumns['hidden'];
    mirrored?: EntryColumns['mirrored'];
    mode?: Mode;
    unversionedData?: EntryColumns['unversionedData'];
    meta?: RevisionColumns['meta'];
    data?: RevisionColumns['data'];
    includePermissionsInfo?: boolean;
};

export async function createEntryInWorkbook(
    ctx: CTX,
    {
        workbookId,
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
    }: CreateEntryInWorkbookData,
) {
    ctx.log('CREATE_ENTRY_IN_WORKBOOK_CALL');

    validateCreateEntryInWorkbook({
        workbookId,
        name,
        scope,
        type,
        links,
        hidden,
        mirrored,
        mode,
        unversionedData,
        meta,
        data,
        includePermissionsInfo,
    });

    const {tenantId, isPrivateRoute, user} = ctx.get('info');
    const createdBy = makeUserId(user.userId);

    const {accessServiceEnabled} = ctx.config;

    const workbook = await getWorkbook(
        {ctx, skipCheckPermissions: isPrivateRoute},
        {workbookId, includePermissionsInfo},
    );

    const createdEntry = await transaction(Entry.primary, async (trx) => {
        if (accessServiceEnabled && !isPrivateRoute) {
            await checkWorkbookPermission({
                ctx,
                trx,
                workbook,
                permission: WorkbookPermission.Update,
            });
        }

        const [entryId, revId] = await Promise.all([getId(), getId()]);

        // TODO: DLS.addEntity / iam registrate entry

        const displayKey = `${entryId}/${name}`;
        const key = displayKey.toLowerCase();

        const syncedLinks = await Entry.syncLinks({entryId, links, ctx, trxOverride: trx});

        const newData = {
            workbookId,
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

        await Entry.query(trx).insert(newData);

        await Revision.query(trx).insert({
            revId,
            entryId,
            meta,
            data,
            links: syncedLinks,
            createdBy: createdBy,
            updatedBy: createdBy,
        });

        return await Entry.query(trx)
            .select(RETURN_COLUMNS.concat('links'))
            .join('revisions', 'entries.entryId', 'revisions.entryId')
            .where({
                'entries.entryId': entryId,
                isDeleted: false,
            })
            .first()
            .timeout(DEFAULT_QUERY_TIMEOUT);
    });

    const resultEntry: Entry & {permissions?: UsPermission} = createdEntry!;
    let permissions: Optional<UsPermission>;

    if (includePermissionsInfo) {
        permissions = getEntryPermissionsByWorkbook({
            ctx,
            workbook,
            scope: resultEntry.scope,
        });

        resultEntry.permissions = permissions;
    }

    ctx.log(BiTrackingLogs.CreateEntry, {
        entryId: Utils.encodeId(resultEntry.entryId),
    });

    return resultEntry;
}
