import {Request, Response} from '@gravity-ui/expresskit';
import {prepareResponseAsync} from '../components/response-presenter';
import {
    deleteColorPalette,
    getColorPalettesList,
    getColorPalette,
    updateColorPalette,
} from '../services/color-palettes';
import {createColorPalette} from '../services/color-palettes/create-color-palette';
import {formatColorPaletteList, formatColorPalette} from '../services/color-palettes/formatters';

export default {
    create: async (req: Request, res: Response) => {
        const {displayName, colors, isDefault, isGradient} = req.body;

        const result = await createColorPalette(
            {ctx: req.ctx},
            {
                displayName,
                colors,
                isDefault,
                isGradient,
            },
        );

        const formattedResponse = formatColorPalette(result);

        const {code, response} = await prepareResponseAsync({data: formattedResponse});

        res.status(code).send(response);
    },

    update: async (req: Request, res: Response) => {
        const {body, params} = req;

        const result = await updateColorPalette(
            {
                ctx: req.ctx,
            },
            {
                colorPaletteId: params.colorPaletteId,
                displayName: body.displayName,
                colors: body.colors,
                isDefault: body.isDefault,
                isGradient: body.isGradient,
            },
        );

        const formattedResponse = formatColorPalette(result);

        const {code, response} = await prepareResponseAsync({data: formattedResponse});

        res.status(code).send(response);
    },

    getList: async (req: Request, res: Response) => {
        const result = await getColorPalettesList(
            {ctx: req.ctx},
            {
                filters: req.query.filters as {colorPaletteId?: string} | undefined,
            },
        );

        const formattedResponse = formatColorPaletteList(result);

        const {code, response} = await prepareResponseAsync({data: formattedResponse});

        res.status(code).send(response);
    },

    get: async (req: Request, res: Response) => {
        const result = await getColorPalette(
            {ctx: req.ctx},
            {
                colorPaletteId: req.params.colorPaletteId,
            },
        );

        const formattedResponse = formatColorPaletteList(result);

        const {code, response} = await prepareResponseAsync({data: formattedResponse});

        res.status(code).send(response);
    },

    delete: async (req: Request, res: Response) => {
        const {colorPaletteId} = req.params;

        await deleteColorPalette(
            {ctx: req.ctx},
            {
                colorPaletteId,
            },
        );

        res.status(200).send();
    },
};
