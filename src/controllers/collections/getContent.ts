import {Request, Response} from '@gravity-ui/expresskit';

import {prepareResponseAsync} from '../../components/response-presenter';
import {
    Mode,
    OrderDirection,
    OrderField,
    getCollectionContent,
} from '../../services/new/collection';
import {formatCollectionContent} from '../../services/new/collection/formatters';
import Utils from '../../utils';

/**
 * @deprecated for structureItemsController.getStructureItems,
 * @todo remove, after successful deploy with UI.
 * Exists for reverse compatibility.
 */
export const getCollectionContentController = async (req: Request, res: Response) => {
    const {query} = req;

    let collectionsPage: Optional<Nullable<number>>;
    if (query.collectionsPage === 'null') {
        collectionsPage = null;
    } else {
        collectionsPage = query.collectionsPage
            ? parseInt(query.collectionsPage as string, 10)
            : undefined;
    }

    let workbooksPage: Optional<Nullable<number>>;
    if (query.workbooksPage === 'null') {
        workbooksPage = null;
    } else {
        workbooksPage = query.workbooksPage
            ? parseInt(query.workbooksPage as string, 10)
            : undefined;
    }

    const result = await getCollectionContent(
        {ctx: req.ctx},
        {
            collectionId: (query.collectionId as Optional<string>) ?? null,
            includePermissionsInfo: Utils.isTrueArg(query.includePermissionsInfo),
            filterString: query.filterString as Optional<string>,
            collectionsPage,
            workbooksPage,
            pageSize: query.pageSize ? parseInt(query.pageSize as string, 10) : undefined,
            orderField: query.orderField as Optional<OrderField>,
            orderDirection: query.orderDirection as Optional<OrderDirection>,
            onlyMy: Utils.isTrueArg(query.onlyMy),
            mode: query.mode as Optional<Mode>,
        },
    );

    const formattedResponse = formatCollectionContent(result);

    const {code, response} = await prepareResponseAsync({data: formattedResponse});

    res.status(code).send(response);
};
