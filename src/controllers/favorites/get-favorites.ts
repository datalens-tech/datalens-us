import {AppRouteHandler, Response} from '@gravity-ui/expresskit';

import {ApiTag} from '../../components/api-docs';
import {CONTENT_TYPE_JSON} from '../../const';
import FavoriteService from '../../services/favorite.service';
import * as ST from '../../types/services.types';
import {isTrueArg} from '../../utils/env-utils';

import {favoritesModel} from './response-models/favorites-model';

export const getFavoritesController: AppRouteHandler = async (req, res: Response) => {
    const query = req.query as unknown as ST.GetFavorite;

    const result = await FavoriteService.get({
        orderBy: query.orderBy,
        filters: query.filters,
        page: query.page && Number(query.page),
        pageSize: query.pageSize && Number(query.pageSize),
        scope: query.scope,
        includePermissionsInfo: isTrueArg(query.includePermissionsInfo),
        ignoreWorkbookEntries: isTrueArg(query.ignoreWorkbookEntries),
        ctx: req.ctx,
    });

    res.status(200).send(await favoritesModel.format(result));
};

getFavoritesController.api = {
    tags: [ApiTag.Favorites],
    summary: 'Get favorites',
    responses: {
        200: {
            description: favoritesModel.schema.description ?? '',
            content: {
                [CONTENT_TYPE_JSON]: {
                    schema: favoritesModel.schema,
                },
            },
        },
    },
};
