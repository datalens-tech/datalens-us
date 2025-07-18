import {AppRouteHandler} from '@gravity-ui/expresskit';

import {ApiTag} from '../../components/api-docs';
import {makeReqParser, z} from '../../components/zod';
import {CONTENT_TYPE_JSON} from '../../const';
import {LogEventType} from '../../registry/common/utils/log-event/types';
import {setDefaultColorPalette} from '../../services/new/tenants';

import {briefTenantWithSettingsModel} from './response-models';

const requestSchema = {
    body: z.object({
        defaultColorPaletteId: z.string(),
    }),
};
export type SetDefaultColorPaletteRequestBodySchema = z.infer<typeof requestSchema.body>;

const parseReq = makeReqParser(requestSchema);

export const setDefaultColorPaletteController: AppRouteHandler = async (req, res) => {
    const {body} = await parseReq(req);
    const registry = req.ctx.get('registry');
    const {logEvent} = registry.common.functions.get();
    try {
        const result = await setDefaultColorPalette(
            {
                ctx: req.ctx,
            },
            {defaultColorPaletteId: body.defaultColorPaletteId},
        );
        logEvent({
            type: LogEventType.SetDefaultColorPaletteSuccess,
            ctx: req.ctx,
            reqBody: body,
            tenant: result,
        });
        res.status(200).send(briefTenantWithSettingsModel.format(result));
    } catch (error) {
        logEvent({
            type: LogEventType.SetDefaultColorPaletteFail,
            ctx: req.ctx,
            reqBody: body,
            error,
        });
        throw error;
    }
};

setDefaultColorPaletteController.api = {
    summary: 'Set default color palette',
    tags: [ApiTag.Tenants],
    request: {
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
            description: briefTenantWithSettingsModel.schema.description ?? '',
            content: {
                [CONTENT_TYPE_JSON]: {
                    schema: briefTenantWithSettingsModel.schema,
                },
            },
        },
    },
};

setDefaultColorPaletteController.manualDecodeId = true;
