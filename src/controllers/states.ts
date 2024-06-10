import {Request, Response} from '@gravity-ui/expresskit';
import {prepareResponseAsync} from '../components/response-presenter';
import {createState, getState} from '../services/new/state';
import {formatCreateStateResponse, formatGetStateResponse} from '../services/new/state/formatters';

export default {
    createState: async (req: Request, res: Response) => {
        const {params, body} = req;

        const result = await createState(
            {ctx: req.ctx},
            {
                entryId: params.entryId,
                data: body.data,
            },
        );
        const formattedResponse = formatCreateStateResponse(result);

        const {code, response} = await prepareResponseAsync({data: formattedResponse});

        res.status(code).send(response);
    },

    getState: async (req: Request, res: Response) => {
        const {params} = req;

        const result = await getState(
            {ctx: req.ctx},
            {
                entryId: params.entryId,
                hash: params.hash,
            },
        );
        const formattedResponse = formatGetStateResponse(result);

        const {code, response} = await prepareResponseAsync({data: formattedResponse});

        res.status(code).send(response);
    },
};
