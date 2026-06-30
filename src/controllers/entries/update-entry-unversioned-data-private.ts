import {AppRouteHandler} from '@gravity-ui/expresskit';

import {ApiTag} from '../../components/api-docs';
import {makeReqParser, z, zc} from '../../components/zod';
import {CONTENT_TYPE_JSON, MAX_UNVERSIONED_DATA_OBJECT_SYMBOLS} from '../../const';
import {LogEventType} from '../../registry/plugins/common/utils/log-event/types';
import {updateEntryUnversionedDataPrivate} from '../../services/new/entry';

import {entryModelWithUnversionedData} from './response-models';

const requestSchema = {
    params: z.object({
        entryId: zc.encodedId(),
    }),
    body: z.object({
        unversionedData: zc.limitedObject({limit: MAX_UNVERSIONED_DATA_OBJECT_SYMBOLS}),
        lockToken: z.string().optional(),
    }),
};

const parseReq = makeReqParser(requestSchema);

export const updateEntryUnversionedDataPrivateController: AppRouteHandler = async (req, res) => {
    const {params, body} = await parseReq(req);

    const {privatePermissions} = req.ctx.get('info');

    const registry = req.ctx.get('registry');
    const {logEvent} = registry.common.functions.get();

    const logEventReqParams = {entryId: params.entryId};

    try {
        const result = await updateEntryUnversionedDataPrivate(
            {
                ctx: req.ctx,
            },
            {
                entryId: params.entryId,
                unversionedData: body.unversionedData,
                lockToken: body.lockToken,
            },
        );

        await logEvent({
            type: LogEventType.UpdateEntryUnversionedDataSuccess,
            ctx: req.ctx,
            data: result,
            reqParams: logEventReqParams,
        });

        res.status(200).send(entryModelWithUnversionedData.format(result, privatePermissions));
    } catch (error) {
        await logEvent({
            type: LogEventType.UpdateEntryUnversionedDataFail,
            ctx: req.ctx,
            reqParams: logEventReqParams,
            error,
        });

        throw error;
    }
};

updateEntryUnversionedDataPrivateController.api = {
    summary: 'Update entry unversioned data',
    tags: [ApiTag.Entries],
    request: {
        params: requestSchema.params,
        body: {
            content: {
                [CONTENT_TYPE_JSON]: {
                    schema: requestSchema.body,
                },
            },
        },
    },
    responses: {
        200: {
            description: entryModelWithUnversionedData.schema.description ?? '',
            content: {
                [CONTENT_TYPE_JSON]: {
                    schema: entryModelWithUnversionedData.schema,
                },
            },
        },
    },
};

updateEntryUnversionedDataPrivateController.manualDecodeId = true;
