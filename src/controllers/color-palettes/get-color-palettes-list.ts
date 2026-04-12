import {AppRouteHandler, Response} from '@gravity-ui/expresskit';

import {ApiTag} from '../../components/api-docs';
import {makeReqParser, z} from '../../components/zod';
import {CONTENT_TYPE_JSON} from '../../const';
import {getColorPalettesList} from '../../services/color-palettes';

import {colorPaletteModelArray} from './response-models';
import type {ColorPaletteResponseModel} from './response-models';

const requestSchema = {
    query: z.object({
        filters: z
            .object({
                colorPaletteId: z.string().optional(),
            })
            .optional(),
    }),
};

const parseReq = makeReqParser(requestSchema);

export const getColorPalettesListController: AppRouteHandler = async (
    req,
    res: Response<ColorPaletteResponseModel[]>,
) => {
    const {query} = await parseReq(req);

    const result = await getColorPalettesList(
        {ctx: req.ctx},
        {
            filters: query.filters,
        },
    );

    res.status(200).send(await colorPaletteModelArray.format(result));
};

getColorPalettesListController.api = {
    summary: 'Get color palettes list',
    tags: [ApiTag.ColorPalettes],
    request: {
        query: requestSchema.query,
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

getColorPalettesListController.manualDecodeId = true;
