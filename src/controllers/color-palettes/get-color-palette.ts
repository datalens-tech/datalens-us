import {AppRouteHandler, Response} from '@gravity-ui/expresskit';

import {ApiTag} from '../../components/api-docs';
import {makeReqParser, z, zc} from '../../components/zod';
import {CONTENT_TYPE_JSON} from '../../const';
import {getColorPalette} from '../../services/color-palettes';

import {ColorPaletteModelArray, colorPaletteModelArray} from './response-models';

const requestSchema = {
    params: z.object({
        colorPaletteId: zc.encodedId(),
    }),
};

const parseReq = makeReqParser(requestSchema);

export const getColorPaletteController: AppRouteHandler = async (
    req,
    res: Response<ColorPaletteModelArray>,
) => {
    const {params} = await parseReq(req);

    const result = await getColorPalette(
        {ctx: req.ctx},
        {
            colorPaletteId: params.colorPaletteId,
        },
    );

    res.status(200).send(await colorPaletteModelArray.format(result));
};

getColorPaletteController.api = {
    summary: 'Get color palette',
    tags: [ApiTag.ColorPalettes],
    request: {
        params: requestSchema.params,
    },
    responses: {
        200: {
            description: colorPaletteModelArray.schema.description ?? '',
            content: {
                [CONTENT_TYPE_JSON]: {
                    schema: colorPaletteModelArray.schema,
                },
            },
        },
    },
};

getColorPaletteController.manualDecodeId = true;
