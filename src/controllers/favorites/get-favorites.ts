import {AppRouteHandler, Response} from '@gravity-ui/expresskit';

import {ApiTag} from '../../components/api-docs';
import {makeReqParser, z, zc} from '../../components/zod';
import {CONTENT_TYPE_JSON} from '../../const';
import {EntryScope} from '../../db/models/new/entry/types';
import FavoriteService from '../../services/favorite.service';
import {isTrueArg} from '../../utils/env-utils';

import {favoritesModel} from './response-models/favorites-model';

const requestSchema = {
    query: z.object({
        orderBy: z
            .object({
                field: z.enum(['name', 'createdAt']),
                direction: z.enum(['asc', 'desc']),
            })
            .optional(),
        filters: z
            .object({
                name: z.string().optional(),
            })
            .optional(),
        page: zc.stringNumber({min: 0}).optional(),
        pageSize: zc.stringNumber({min: 1, max: 200}).optional(),
        scope: z
            .nativeEnum(EntryScope)
            .or(z.array(z.nativeEnum(EntryScope)))
            .optional(),
        includePermissionsInfo: zc.stringBoolean().optional(),
        ignoreWorkbookEntries: zc.stringBoolean().optional(),
    }),
};

const parseReq = makeReqParser(requestSchema);

export const getFavoritesController: AppRouteHandler = async (req, res: Response) => {
    const {query} = await parseReq(req);
    const {orderBy, filters, page, pageSize, scope, includePermissionsInfo, ignoreWorkbookEntries} =
        query;
    const result = await FavoriteService.get({
        orderBy,
        filters,
        page,
        pageSize,
        scope,
        includePermissionsInfo: isTrueArg(includePermissionsInfo),
        ignoreWorkbookEntries: isTrueArg(ignoreWorkbookEntries),
        ctx: req.ctx,
    });

    res.status(200).send(await favoritesModel.format(result));
};

getFavoritesController.api = {
    tags: [ApiTag.Favorites],
    summary: 'Get favorites',
    request: {
        query: requestSchema.query,
    },
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
getFavoritesController.manualDecodeId = true;
