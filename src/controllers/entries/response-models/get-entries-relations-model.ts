import {z} from '../../../components/zod';
import {EntryScope} from '../../../db/models/new/entry/types';
import {EntryRelationWithPermissions, GetEntriesRelationsResult} from '../../../services/new/entry';
import Utils from '../../../utils';

import {entryFullPermissionsModel} from './entry-full-permissions-model';
import {entryPermissionsModel} from './entry-permissions-model';

const relationItemSchema = z
    .object({
        entryId: z.string(),
        key: z.string().nullable(),
        scope: z.enum(EntryScope),
        type: z.string(),
        createdAt: z.string(),
        public: z.boolean(),
        tenantId: z.string().nullable(),
        workbookId: z.string().nullable(),
        collectionId: z.string().nullable(),
        isLocked: z.boolean().optional(),
        permissions: entryPermissionsModel.schema.optional(),
        fullPermissions: entryFullPermissionsModel.schema.optional(),
    })
    .describe('Entry relation item');

const schema = z
    .object({
        relations: z.array(relationItemSchema),
        nextPageToken: z.string().optional(),
    })
    .describe('Get entries relations result');

const formatRelation = (
    relation: EntryRelationWithPermissions,
): z.infer<typeof relationItemSchema> => {
    return {
        entryId: Utils.encodeId(relation.entryId),
        key: relation.workbookId || relation.collectionId ? null : relation.key,
        scope: relation.scope,
        type: relation.type,
        createdAt: relation.createdAt,
        public: relation.public,
        tenantId: relation.tenantId,
        workbookId: Utils.encodeIdOrNull(relation.workbookId),
        collectionId: Utils.encodeIdOrNull(relation.collectionId),
        isLocked: relation.isLocked,
        permissions: relation.permissions,
        fullPermissions: relation.fullPermissions
            ? entryFullPermissionsModel.format(relation.fullPermissions, relation.scope)
            : undefined,
    };
};

const format = async ({
    relations,
    nextPageToken,
}: GetEntriesRelationsResult): Promise<z.infer<typeof schema>> => {
    return {
        relations: await Utils.macrotasksMap(relations, formatRelation),
        nextPageToken,
    };
};

export const getEntriesRelationsResult = {
    schema,
    format,
};
