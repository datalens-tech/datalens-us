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
import {updateEntry} from '../../services/entry';
import {UpdateEntryData} from '../../services/entry/actions/update-entry';

import {updateEntryModel} from './response-models/update-entry-model';

export const updateEntryController = withContract({
    operationId: 'updateEntry',
    summary: 'Update entry',
    tags: [ApiTag.Entries],
    request: {
        params: z.object({
            entryId: zc.encodedId(),
        }),
        body: z.object({
            meta: zc
                .limitedObject({limit: MAX_META_OBJECT_SYMBOLS})
                .refine(zc.noNestedObjectValues, {message: 'Meta values cannot be objects'})
                .nullable()
                .optional(),
            data: z.record(z.string(), z.unknown()).nullable().optional(),
            description: z.string().max(ANNOTATION_DESCRIPTION_MAX_LENGTH).optional(),
            annotation: z
                .object({description: z.string().max(ANNOTATION_DESCRIPTION_MAX_LENGTH)})
                .optional(),
            unversionedData: zc
                .limitedObject({limit: MAX_UNVERSIONED_DATA_OBJECT_SYMBOLS})
                .nullish(),
            links: z.record(z.string(), z.string()).optional(),
            mode: z.enum(['save', 'publish', 'recover']).optional(),
            type: z.string().optional(),
            hidden: z.boolean().optional(),
            mirrored: z.boolean().optional(),
            revId: zc.encodedId().optional(),
            lockToken: z.string().optional(),
            skipSyncLinks: z.boolean().optional(),
            updateRevision: z.boolean().optional(),
            checkServicePlan: z.string().optional(),
            checkTenantFeatures: z.array(z.string()).optional(),
            version: z.number().nullish(),
            sourceVersion: z.number().nullish(),
            currentScope: z.enum(EntryScope).optional(),
            currentType: z.string().optional(),
        }),
    },
    response: {
        content: {
            200: {
                schema: updateEntryModel.schema,
                description: updateEntryModel.schema.description,
            },
        },
    },
})(async (req, res) => {
    const {params, body} = req;

    const {privatePermissions} = req.ctx.get('info');

    const registry = req.ctx.get('registry');
    const {logEvent} = registry.common.functions.get();

    const logEventReqParams = {entryId: params.entryId};

    try {
        const updateArgs: UpdateEntryData = {
            entryId: params.entryId,
            meta: body.meta,
            data: body.data,
            description: body.description,
            annotation: body.annotation,
            unversionedData: body.unversionedData,
            links: body.links,
            mode: body.mode,
            type: body.type,
            hidden: body.hidden,
            mirrored: body.mirrored,
            revId: body.revId,
            lockToken: body.lockToken,
            skipSyncLinks: body.skipSyncLinks,
            updateRevision: body.updateRevision,
            checkServicePlan: body.checkServicePlan,
            checkTenantFeatures: body.checkTenantFeatures,
            version: body.version,
            sourceVersion: body.sourceVersion,
            currentScope: body.currentScope,
            currentType: body.currentType,
        };

        const result = await updateEntry(req.ctx, updateArgs);

        await logEvent({
            type: LogEventType.UpdateEntrySuccess,
            ctx: req.ctx,
            data: result,
            reqParams: logEventReqParams,
        });

        res.sendTyped(200, updateEntryModel.format(result, privatePermissions));
    } catch (error) {
        await logEvent({
            type: LogEventType.UpdateEntryFail,
            ctx: req.ctx,
            reqParams: logEventReqParams,
            error,
        });

        throw error;
    }
});

updateEntryController.manualDecodeId = true;
