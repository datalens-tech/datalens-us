import {AppRouteHandler, Response} from '@gravity-ui/expresskit';

import {ApiTag} from '../../components/api-docs';
import {makeReqParser, z, zc} from '../../components/zod';
import {CONTENT_TYPE_JSON} from '../../const';
import {LogEventType} from '../../registry/common/utils/log-event/types';
import {updateColorPalette} from '../../services/color-palettes';

import {colorPaletteModel} from './response-models';
import type {ColorPaletteResponseModel} from './response-models';

const requestSchema = {
    params: z.object({
        colorPaletteId: zc.encodedId(),
    }),
    body: z.object({
        displayName: z.string(),
        colors: z
            .string()
            .regex(/^#([a-fA-F0-9]{6}|[a-fA-F0-9]{3})$/)
            .array(),
        isGradient: z.boolean(),
        isDefault: z.boolean(),
    }),
};

export type UpdateColorPaletteReqParams = z.infer<typeof requestSchema.params>;
export type UpdateColorPaletteReqBody = z.infer<typeof requestSchema.body>;

const parseReq = makeReqParser(requestSchema);

export const updateColorPaletteController: AppRouteHandler = async (
    req,
    res: Response<ColorPaletteResponseModel>,
) => {
    const {params, body} = await parseReq(req);

    const registry = req.ctx.get('registry');
    const {logEvent} = registry.common.functions.get();

    try {
        const result = await updateColorPalette(
            {ctx: req.ctx},
            {
                colorPaletteId: params.colorPaletteId,
                displayName: body.displayName,
                colors: body.colors,
                isDefault: body.isDefault,
                isGradient: body.isGradient,
            },
        );

        logEvent({
            type: LogEventType.UpdateColorPaletteSuccess,
            ctx: req.ctx,
            reqParams: params,
            reqBody: body,
            colorPalette: result,
        });

        res.status(200).send(colorPaletteModel.format(result));
    } catch (error) {
        logEvent({
            type: LogEventType.UpdateColorPaletteFail,
            ctx: req.ctx,
            reqParams: params,
            reqBody: body,
            error,
        });

        throw error;
    }
};

updateColorPaletteController.api = {
    summary: 'Update color palette',
    tags: [ApiTag.ColorPalettes],
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
            description: colorPaletteModel.schema.description ?? '',
            content: {
                [CONTENT_TYPE_JSON]: {
                    schema: colorPaletteModel.schema,
                },
            },
        },
    },
};

updateColorPaletteController.manualDecodeId = true;
