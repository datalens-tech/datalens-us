import {Request, Response} from '@gravity-ui/expresskit';

import {prepareResponseAsync} from '../components/response-presenter';
import {Mode, OrderDirection, OrderField, getStructureItems} from '../services/new/structure-item';
import {formatStructureItems} from '../services/new/structure-item/formatters/format-structure-items';
import {isTrueArg} from '../utils/env-utils';

export default {
    getStructureItems: async (req: Request, res: Response) => {
        const {query} = req;

        const result = await getStructureItems(
            {ctx: req.ctx},
            {
                collectionId: (query.collectionId as Optional<string>) ?? null,
                includePermissionsInfo: isTrueArg(query.includePermissionsInfo),
                filterString: query.filterString as Optional<string>,
                page: query.page ? parseInt(query.page as string, 10) : undefined,
                pageSize: query.pageSize ? parseInt(query.pageSize as string, 10) : undefined,
                orderField: query.orderField as Optional<OrderField>,
                orderDirection: query.orderDirection as Optional<OrderDirection>,
                onlyMy: isTrueArg(query.onlyMy),
                mode: query.mode as Optional<Mode>,
            },
        );

        const formattedResponse = formatStructureItems(result);

        const {code, response} = await prepareResponseAsync({data: formattedResponse});

        res.status(code).send(response);
    },
};
