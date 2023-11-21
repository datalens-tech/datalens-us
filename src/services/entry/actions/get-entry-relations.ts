import {AppError} from '@gravity-ui/nodekit';
import {EntryPermissions} from '../../new/entry/types';
import Entry from '../../../db/models/entry';
import {CTX, DlsActions} from '../../../types/models';
import Utils, {logInfo} from '../../../utils';
import {US_ERRORS} from '../../../const';
import {makeSchemaValidator} from '../../../components/validation-schema-compiler';
import {getWorkbook} from '../../new/workbook/get-workbook';
import {getEntryPermissionsByWorkbook} from '../../new/workbook/utils';
import {getRelatedEntries} from './get-related-entries';
import {checkEntry} from './check-entry';
import {registry} from '../../../registry';

export type GetEntryRelationsData = {
    entryId: string;
    direction?: string;
    includePermissionsInfo: boolean;
};

const validateParams = makeSchemaValidator({
    type: 'object',
    required: ['entryId', 'includePermissionsInfo'],
    properties: {
        entryId: {
            type: 'string',
        },
        direction: {
            type: 'string',
            enum: ['parent', 'child'],
        },
        includePermissionsInfo: {
            type: 'boolean',
        },
    },
});

export async function getEntryRelations(ctx: CTX, params: GetEntryRelationsData) {
    const {entryId, direction, includePermissionsInfo} = params;
    const {tenantId, isPrivateRoute} = ctx.get('info');

    logInfo(ctx, 'GET_ENTRY_RELATIONS_REQUEST', {
        entryId: Utils.encodeId(entryId),
        direction,
        includePermissionsInfo,
    });

    const {DLS} = registry.common.classes.get();

    validateParams(params);

    const validatedDirection = direction as Optional<'parent' | 'child'>;

    const entry = await Entry.query(Entry.replica)
        .where({
            entryId,
        })
        .first()
        .timeout(Entry.DEFAULT_QUERY_TIMEOUT);

    if (!entry) {
        throw new AppError(US_ERRORS.NOT_EXIST_ENTRY, {
            code: US_ERRORS.NOT_EXIST_ENTRY,
        });
    }

    if (!entry.workbookId && !isPrivateRoute) {
        await checkEntry(ctx, Entry.replica, {verifiableEntry: entry});
    }

    let relations = await getRelatedEntries(ctx, {
        entryIds: [entryId],
        direction: validatedDirection,
    });

    if (entry.workbookId) {
        const workbook = await getWorkbook(
            {
                ctx,
                trx: Entry.replica,
            },
            {workbookId: entry.workbookId, includePermissionsInfo},
        );

        relations = relations.filter(
            (relationEntry) => relationEntry.workbookId === entry.workbookId,
        );

        relations = relations.map((item) => {
            let iamPermissions: Optional<EntryPermissions>;

            if (includePermissionsInfo) {
                iamPermissions = getEntryPermissionsByWorkbook({
                    ctx,
                    workbook,
                    scope: entry.scope,
                });
            }

            return {
                ...item,
                permissions: iamPermissions,
            };
        }) as Entry[];
    } else {
        if (!isPrivateRoute && ctx.config.dlsEnabled) {
            relations = await DLS.checkBulkPermission(
                {ctx},
                {
                    entities: relations,
                    action: DlsActions.Read,
                    includePermissionsInfo,
                },
            );
        }

        if (includePermissionsInfo && !ctx.config.dlsEnabled) {
            relations = relations.map((item) => ({
                ...item,
                permissions: {
                    execute: true,
                    read: true,
                    edit: true,
                    admin: true,
                },
            })) as Entry[];
        }
    }

    ctx.log('GET_ENTRY_RELATIONS_SUCCESS');

    return isPrivateRoute
        ? relations.filter((item) => item.tenantId === entry.tenantId)
        : relations.filter((item) => item.tenantId === tenantId);
}
