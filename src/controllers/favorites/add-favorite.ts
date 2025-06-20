import {AppRouteHandler} from '@gravity-ui/expresskit';

import {ApiTag} from '../../components/api-docs';
import {makeReqParser, z, zc} from '../../components/zod';
import {CONTENT_TYPE_JSON} from '../../const';
import FavoriteService from '../../services/favorite.service';

import {favoriteInstanceModel} from './response-models/favorite-instance-model';

const requestSchema = {
    params: z.object({
        entryId: zc.encodedId(),
    }),
};
const parseReq = makeReqParser(requestSchema);

export const addFavoriteController: AppRouteHandler = async (req, res) => {
    const {params} = await parseReq(req);
    const {entryId} = params;

    const result = await FavoriteService.add({
        entryId,
        ctx: req.ctx,
    });

    res.status(200).send(favoriteInstanceModel.format(result));
};

addFavoriteController.api = {
    tags: [ApiTag.Favorites],
    summary: 'Add entry to favorites',
    request: {
        params: requestSchema.params,
    },
    responses: {
        200: {
            description: favoriteInstanceModel.schema.description ?? '',
            content: {
                [CONTENT_TYPE_JSON]: {
                    schema: favoriteInstanceModel.schema,
                },
            },
        },
    },
};

addFavoriteController.manualDecodeId = true;
