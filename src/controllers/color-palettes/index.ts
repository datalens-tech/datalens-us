import {Request, Response} from '@gravity-ui/expresskit';

import {prepareResponseAsync} from '../../components/response-presenter';
import {getColorPalette, getColorPalettesList} from '../../services/color-palettes';
import {formatColorPaletteList} from '../../services/color-palettes/formatters';

import {createColorPaletteController} from './create-color-palette';
import {deleteColorPaletteController} from './delete-color-palette';
import {updateColorPaletteController} from './update-color-palette';

export default {
    createColorPaletteController,
    updateColorPaletteController,
    deleteColorPaletteController,

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
};
