import {z} from '../../../components/zod';
import {EntryScope} from '../../../db/models/new/entry/types';
import type {GetEntryRelationsResult, RelationItem} from '../../../services/entry';
import Utils from '../../../utils';

import {entryPermissionsModel} from './entry-permissions-model';
import {sharedEntryPermissionsModel} from './shared-entry-permissions-model';

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
        depth: z.number(),
        meta: z.record(z.string(), z.unknown()).nullable(),
        links: z.record(z.string(), z.unknown()).nullable(),
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
    .describe('Get entry relations result');

const formatRelation = (relation: RelationItem): z.infer<typeof relationItemSchema> => {
    return {
        entryId: Utils.encodeId(relation.entryId),
        key: relation.key,
        scope: relation.scope,
        type: relation.type,
        createdAt: relation.createdAt,
        public: relation.public,
        tenantId: relation.tenantId,
        workbookId: relation.workbookId ? Utils.encodeId(relation.workbookId) : null,
        collectionId: relation.collectionId ? Utils.encodeId(relation.collectionId) : null,
        depth: relation.depth,
        meta: relation.meta ?? null,
        links: relation.links ?? null,
        isLocked: relation.isLocked,
        permissions: relation.permissions,
        fullPermissions: relation.fullPermissions,
    };
};

const format = async ({
    relations,
    nextPageToken,
}: GetEntryRelationsResult): Promise<z.infer<typeof schema>> => {
    return {
        relations: await Utils.macrotasksMap(relations, formatRelation),
        nextPageToken,
    };
};

export const entryRelationsPageModel = {
    schema,
    format,
};
