import {Request, Response} from '@gravity-ui/expresskit';

import {prepareResponseAsync} from '../../components/response-presenter';
import {getCollectionsListByIds} from '../../services/new/collection';
import {formatCollectionModel} from '../../services/new/collection/formatters';

export const getCollectionsListByIdsController = async (req: Request, res: Response) => {
    const {body} = req;

    const result = await getCollectionsListByIds(
        {ctx: req.ctx},
        {
            collectionIds: body.collectionIds,
        },
    );

    const formattedResponse = result.map((instance) => formatCollectionModel(instance.model));
    const {code, response} = await prepareResponseAsync({data: formattedResponse});
    res.status(code).send(response);
};
