import {AppRouteHandler, Response} from '@gravity-ui/expresskit';

import {ApiTag} from '../../components/api-docs';
import {makeReqParser, z, zc} from '../../components/zod';
import {LogEventType} from '../../registry/common/utils/log-event/types';
import {deleteColorPalette} from '../../services/color-palettes';

import type {ColorPaletteResponseModel} from './response-models';

const requestSchema = {
    params: z.object({
        colorPaletteId: zc.encodedId(),
    }),
};

export type DeleteColorPaletteReqParams = z.infer<typeof requestSchema.params>;

const parseReq = makeReqParser(requestSchema);

export const deleteColorPaletteController: AppRouteHandler = async (
    req,
    res: Response<ColorPaletteResponseModel>,
) => {
    const {params} = await parseReq(req);

    const {colorPaletteId} = params;

    const registry = req.ctx.get('registry');
    const {logEvent} = registry.common.functions.get();

    try {
        const result = await deleteColorPalette(
            {ctx: req.ctx},
            {
                colorPaletteId,
            },
        );

        logEvent({
            type: LogEventType.DeleteColorPaletteSuccess,
            ctx: req.ctx,
            reqParams: params,
            colorPalette: result,
        });

        res.status(200).send();
    } catch (error) {
        logEvent({
            type: LogEventType.DeleteColorPaletteFail,
            ctx: req.ctx,
            reqParams: params,
            error,
        });

        throw error;
    }
};

deleteColorPaletteController.api = {
    summary: 'Delete color palette',
    tags: [ApiTag.ColorPalettes],
    request: {
        params: requestSchema.params,
    },
    responses: {
        200: {
            description: '',
        },
    },
};

deleteColorPaletteController.manualDecodeId = true;
