import {Request, Response} from '@gravity-ui/expresskit';

import {prepareResponseAsync} from '../../components/response-presenter';
import {getCollectionBreadcrumbs} from '../../services/new/collection';
import {formatGetCollectionBreadcrumbs} from '../../services/new/collection/formatters';
import Utils from '../../utils';

export const getCollectionBreadcrumbsController = async (req: Request, res: Response) => {
    const {params, query} = req;

    const result = await getCollectionBreadcrumbs(
        {ctx: req.ctx},
        {
            collectionId: params.collectionId,
            includePermissionsInfo: Utils.isTrueArg(query.includePermissionsInfo),
        },
    );

    const formattedResponse = formatGetCollectionBreadcrumbs(result);

    const {code, response} = await prepareResponseAsync({data: formattedResponse});

    res.status(code).send(response);
};
