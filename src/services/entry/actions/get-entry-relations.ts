import {AppError} from '@gravity-ui/nodekit';
import {Entry, EntryColumn} from '../../../db/models/new/entry';
import {DlsActions} from '../../../types/models';
import {ServiceArgs} from '../../new/types';
import Utils from '../../../utils';
import {US_ERRORS} from '../../../const';
import {makeSchemaValidator} from '../../../components/validation-schema-compiler';
import {getWorkbook} from '../../new/workbook/get-workbook';
import {getEntryPermissionsByWorkbook} from '../../new/workbook/utils';
import {getRelatedEntries, RelationDirection} from './get-related-entries';
import {registry} from '../../../registry';
import {getReplica} from '../../new/utils';

export type GetEntryRelationsArgs = {
    entryId: string;
    direction?: RelationDirection;
    includePermissionsInfo?: boolean;
};

const validateArgs = makeSchemaValidator({
    type: 'object',
    required: ['entryId'],
    properties: {
        entryId: {
            type: 'string',
        },
        direction: {
            type: 'string',
            enum: [RelationDirection.Parent, RelationDirection.Child],
        },
        includePermissionsInfo: {
            type: 'boolean',
        },
    },
});

export async function getEntryRelations(
    {ctx, trx, skipValidation = false}: ServiceArgs,
    args: GetEntryRelationsArgs,
) {
    const {DLS} = registry.common.classes.get();

    const {tenantId, isPrivateRoute} = ctx.get('info');

    const {entryId, direction = RelationDirection.Parent, includePermissionsInfo = false} = args;

    ctx.log('GET_ENTRY_RELATIONS_REQUEST', {
        entryId: Utils.encodeId(entryId),
        direction,
        includePermissionsInfo,
    });

    if (!skipValidation) {
        validateArgs(args);
    }

    const entry = await Entry.query(getReplica(trx))
        .where({
            [EntryColumn.EntryId]: entryId,
            [EntryColumn.IsDeleted]: false,
            ...(isPrivateRoute ? {} : {[EntryColumn.TenantId]: tenantId}),
        })
        .first()
        .timeout(Entry.DEFAULT_QUERY_TIMEOUT);

    if (!entry) {
        throw new AppError(US_ERRORS.NOT_EXIST_ENTRY, {
            code: US_ERRORS.NOT_EXIST_ENTRY,
        });
    }

    let relations = await getRelatedEntries(
        {ctx, trx: getReplica(trx)},
        {
            entryIds: [entryId],
            direction,
        },
    );

    relations = relations.filter((item) => item.tenantId === entry.tenantId);

    if (entry.workbookId) {
        const workbook = await getWorkbook(
            {
                ctx,
                trx: getReplica(trx),
            },
            {workbookId: entry.workbookId, includePermissionsInfo},
        );

        relations = relations
            .filter((item) => item.workbookId === entry.workbookId)
            .map((item) => ({...item, isLocked: false}));

        if (includePermissionsInfo) {
            relations = relations.map((item) => {
                return {
                    ...item,
                    permissions: getEntryPermissionsByWorkbook({
                        ctx,
                        workbook,
                        scope: item.scope,
                    }),
                };
            });
        }
    } else {
        const skipDLS = isPrivateRoute || !ctx.config.dlsEnabled;

        if (skipDLS) {
            relations = relations.map((item) => {
                return {
                    ...item,
                    isLocked: false,
                    ...(includePermissionsInfo
                        ? {
                              permissions: {
                                  execute: true,
                                  read: true,
                                  edit: true,
                                  admin: true,
                              },
                          }
                        : {}),
                };
            });
        } else {
            relations = await DLS.checkBulkPermission(
                {ctx},
                {
                    entities: relations,
                    action: DlsActions.Read,
                    includePermissionsInfo,
                },
            );
        }
    }

    ctx.log('GET_ENTRY_RELATIONS_SUCCESS', {count: relations.length});

    return relations;
}
