import {AppRouteHandler} from '@gravity-ui/expresskit';

import {ApiTag} from '../../components/api-docs';
import {makeReqParser, z, zc} from '../../components/zod';
import {CONTENT_TYPE_JSON} from '../../const';
import {addFavoriteService} from '../../services/new/favorites/add-favorite';

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

    const result = await addFavoriteService({ctx: req.ctx}, {entryId});

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
