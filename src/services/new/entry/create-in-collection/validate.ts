import {makeParser, z, zc} from '../../../../components/zod';
import {
    ANNOTATION_DESCRIPTION_MAX_LENGTH,
    MAX_META_OBJECT_SYMBOLS,
    MAX_UNVERSIONED_DATA_OBJECT_SYMBOLS,
} from '../../../../const/common';
import {EntryScope} from '../../../../db/models/new/entry/types';

const allowedScopes = [EntryScope.Connection, EntryScope.Dataset];

const requestSchema = z.object({
    collectionId: z.string(),
    scope: z.nativeEnum(EntryScope).refine((val) => allowedScopes.includes(val), {
        message: `Must be one of the values: ${allowedScopes.join(', ')}`,
    }),
    name: zc.entityName(),
    type: z.string().optional(),
    links: z.record(z.string(), z.string()).optional(),
    hidden: z.boolean().optional(),
    mirrored: z.boolean().optional(),
    mode: z.enum(['save', 'publish']).optional(),
    unversionedData: zc.limitedObject({limit: MAX_UNVERSIONED_DATA_OBJECT_SYMBOLS}).optional(),
    meta: zc.limitedObject({limit: MAX_META_OBJECT_SYMBOLS}).nullable().optional(),
    data: z.record(z.string(), z.unknown()).nullable().optional(),
    includePermissionsInfo: z.boolean().optional(),
    description: z.string().max(ANNOTATION_DESCRIPTION_MAX_LENGTH).optional(),
    annotation: z
        .object({description: z.string().max(ANNOTATION_DESCRIPTION_MAX_LENGTH)})
        .optional(),
});

export type CreateEntryInCollectionArgs = z.infer<typeof requestSchema>;

export const parseArgs = makeParser(requestSchema);
