import {AppRouteHandler, Response} from '@gravity-ui/expresskit';

import {ApiTag} from '../../components/api-docs';
import {makeReqParser, z} from '../../components/zod';
import {CONTENT_TYPE_JSON} from '../../const';
import {LogEventType} from '../../registry/common/utils/log-event/types';
import {createColorPalette} from '../../services/color-palettes/create-color-palette';

import {colorPaletteModel} from './response-models';
import type {ColorPaletteResponseModel} from './response-models';

const requestSchema = {
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

export type CreateColorPaletteReqBody = z.infer<typeof requestSchema.body>;

const parseReq = makeReqParser(requestSchema);

const controller: AppRouteHandler = async (req, res: Response<ColorPaletteResponseModel>) => {
    const {body} = await parseReq(req);

    const {displayName, colors, isDefault, isGradient} = body;

    const registry = req.ctx.get('registry');
    const {logEvent} = registry.common.functions.get();

    try {
        const result = await createColorPalette(
            {ctx: req.ctx},
            {
                displayName,
                colors,
                isDefault,
                isGradient,
            },
        );

        logEvent({
            type: LogEventType.CreateColorPaletteSuccess,
            ctx: req.ctx,
            reqBody: body,
            colorPalette: result,
        });

        res.status(200).send(colorPaletteModel.format(result));
    } catch (error) {
        logEvent({
            type: LogEventType.CreateColorPaletteFail,
            ctx: req.ctx,
            reqBody: body,
            error,
        });

        throw error;
    }
};

controller.api = {
    summary: 'Create color palette',
    tags: [ApiTag.ColorPalettes],
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
            description: colorPaletteModel.schema.description ?? '',
            content: {
                [CONTENT_TYPE_JSON]: {
                    schema: colorPaletteModel.schema,
                },
            },
        },
    },
};

controller.manualDecodeId = true;

export {controller as createColorPalette};
