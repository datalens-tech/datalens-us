import {z} from '../../../components/zod';
import {EntryScope} from '../../../db/models/new/entry/types';
import {EntryRelationWithPermissions, GetEntriesRelationsResult} from '../../../services/new/entry';
import Utils from '../../../utils';
import {entryPermissionsModel, sharedEntryPermissionsModel} from '../response-models';

const relationItemSchema = z
    .object({
        entryId: z.string(),
        key: z.string().nullable(),
        scope: z.nativeEnum(EntryScope),
        type: z.string(),
        createdAt: z.string(),
        public: z.boolean(),
        tenantId: z.string().nullable(),
        workbookId: z.string().nullable(),
        collectionId: z.string().nullable(),
        isLocked: z.boolean().optional(),
        permissions: entryPermissionsModel.schema.optional(),
        fullPermissions: sharedEntryPermissionsModel.schema.optional(),
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
        workbookId: relation.workbookId ? Utils.encodeId(relation.workbookId) : null,
        collectionId: relation.collectionId ? Utils.encodeId(relation.collectionId) : null,
        isLocked: relation.isLocked,
        permissions: relation.permissions,
        fullPermissions: relation.fullPermissions,
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
