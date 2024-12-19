import {Request, Response} from '@gravity-ui/expresskit';

import {prepareResponseAsync} from '../../components/response-presenter';
import {getCollection} from '../../services/new/collection';
import {formatCollection} from '../../services/new/collection/formatters';
import Utils from '../../utils';

export const getCollectionController = async (req: Request, res: Response) => {
    const {params, query} = req;

    const result = await getCollection(
        {ctx: req.ctx},
        {
            collectionId: params.collectionId,
            includePermissionsInfo: Utils.isTrueArg(query.includePermissionsInfo),
        },
    );

    const formattedResponse = formatCollection(result);

    const {code, response} = await prepareResponseAsync({data: formattedResponse});

    res.status(code).send(response);
};
