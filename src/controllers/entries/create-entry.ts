import {withContract} from '@gravity-ui/expresskit';

import {ApiTag} from '../../components/api-docs';
import {z, zc} from '../../components/zod';
import {
    ANNOTATION_DESCRIPTION_MAX_LENGTH,
    MAX_META_OBJECT_SYMBOLS,
    MAX_UNVERSIONED_DATA_OBJECT_SYMBOLS,
} from '../../const';
import {EntryScope} from '../../db/models/new/entry/types';
import {LogEventType} from '../../registry/plugins/common/utils/log-event/types';
import EntryService from '../../services/entry.service';
import {DlsPermissionsMode, SyncLinks} from '../../types/models';

import {createEntryModel} from './response-models/create-entry-model';

export const createEntryController = withContract({
    operationId: 'createEntry',
    summary: 'Create entry',
    tags: [ApiTag.Entries],
    request: {
        body: z
            .object({
                workbookId: zc.encodedId().optional(),
                collectionId: zc.encodedId().optional(),
                name: z.string().optional(),
                scope: z.enum(EntryScope).optional(),
                type: z.string().optional(),
                key: z.string().optional(),
                meta: zc
                    .limitedObject({limit: MAX_META_OBJECT_SYMBOLS})
                    .refine(zc.noNestedObjectValues, {message: 'Meta values cannot be objects'})
                    .nullable()
                    .optional(),
                description: z.string().max(ANNOTATION_DESCRIPTION_MAX_LENGTH).optional(),
                annotation: z
                    .object({description: z.string().max(ANNOTATION_DESCRIPTION_MAX_LENGTH)})
                    .strict()
                    .optional(),
                recursion: z.boolean().optional(),
                hidden: z
                    .boolean()
                    .nullish()
                    .transform((value) => value ?? false),
                mirrored: z.boolean().optional(),
                mode: z.enum(['save', 'publish']).optional(),
                data: z.record(z.string(), z.unknown()).nullable().optional(),
                unversionedData: zc
                    .limitedObject({limit: MAX_UNVERSIONED_DATA_OBJECT_SYMBOLS})
                    .nullish(),
                links: z.record(z.string(), z.string()).optional(),
                permissionsMode: z.enum(['explicit', 'parent_and_owner', 'owner_only']).optional(),
                includePermissionsInfo: z.boolean().optional(),
                initialPermissions: z
                    .record(
                        z.string(),
                        z.array(z.object({subject: z.string(), comment: z.string().optional()})),
                    )
                    .optional(),
                initialParentId: z.string().optional(),
                checkServicePlan: z.string().optional(),
                checkTenantFeatures: z.array(z.string()).optional(),
                version: z.number().nullish(),
                sourceVersion: z.number().nullish(),
            })
            .superRefine((data, ctx) => {
                if (data.workbookId && data.collectionId) {
                    ctx.addIssue({
                        code: 'custom',
                        path: ['collectionId'],
                        message: 'Cannot specify both workbookId and collectionId',
                    });
                }
            })
            .superRefine((data, ctx) => {
                if (data.scope === EntryScope.Compute && !data.collectionId) {
                    ctx.addIssue({
                        code: 'custom',
                        path: ['collectionId'],
                        message: 'Compute entries can only be created in a collection',
                    });
                }
            }),
    },
    response: {
        content: {
            200: {
                schema: createEntryModel.schema,
                description: createEntryModel.schema.description,
            },
        },
    },
})(async (req, res) => {
    const {body} = req;

    const {privatePermissions} = req.ctx.get('info');

    const registry = req.ctx.get('registry');
    const {logEvent} = registry.common.functions.get();

    const logEventReqParams = {
        workbookId: body.workbookId,
        collectionId: body.collectionId,
        name: body.name,
        scope: body.scope,
        type: body.type,
        key: body.key,
        recursion: body.recursion,
    };

    try {
        const result = await EntryService.create({
            workbookId: body.workbookId,
            collectionId: body.collectionId,
            name: body.name,
            scope: body.scope as EntryScope,
            type: body.type,
            key: body.key,
            meta: body.meta,
            description: body.description,
            annotation: body.annotation,
            recursion: body.recursion,
            hidden: body.hidden,
            mirrored: body.mirrored,
            mode: body.mode,
            data: body.data,
            unversionedData: body.unversionedData,
            links: body.links as SyncLinks | undefined,
            permissionsMode: body.permissionsMode as DlsPermissionsMode | undefined,
            includePermissionsInfo: body.includePermissionsInfo,
            initialPermissions: body.initialPermissions,
            initialParentId: body.initialParentId,
            checkServicePlan: body.checkServicePlan,
            checkTenantFeatures: body.checkTenantFeatures,
            version: body.version,
            sourceVersion: body.sourceVersion,
            ctx: req.ctx,
        });

        await logEvent({
            type: LogEventType.CreateEntrySuccess,
            ctx: req.ctx,
            data: result,
            reqParams: logEventReqParams,
        });

        // createEntry returns a union (single entry or array) that sendTyped can't narrow,
        // and we don't want response validation overhead/uncertainty here — send directly.
        res.status(200).send(await createEntryModel.format(result, privatePermissions));
    } catch (error) {
        await logEvent({
            type: LogEventType.CreateEntryFail,
            ctx: req.ctx,
            reqParams: logEventReqParams,
            error,
        });

        throw error;
    }
});

createEntryController.manualDecodeId = true;
