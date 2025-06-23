import {AppRouteHandler} from '@gravity-ui/expresskit';

import {ApiTag} from '../../components/api-docs';
import {makeReqParser, z, zc} from '../../components/zod';
import {CONTENT_TYPE_JSON} from '../../const';
import {renameFavoriteService} from '../../services/new/favorites/rename-favorites';

import {favoriteEntryModel} from './response-models/favorite-entry-model';
import {favoriteInstanceModel} from './response-models/favorite-instance-model';

const requestSchema = {
    params: z.object({
        entryId: zc.encodedId(),
    }),
    body: z.object({
        name: zc.entryName().nullable(),
    }),
};
const parseReq = makeReqParser(requestSchema);

export const renameFavoriteController: AppRouteHandler = async (req, res) => {
    const {params, body} = await parseReq(req);
    const {entryId} = params;
    const {name} = body;

    const result = await renameFavoriteService({ctx: req.ctx}, {entryId, name});

    res.status(200).send(favoriteInstanceModel.format(result[0]));
};

renameFavoriteController.api = {
    tags: [ApiTag.Favorites],
    summary: 'Rename favorite entry',
    request: {
        params: requestSchema.params,
        body: {
            content: {
                [CONTENT_TYPE_JSON]: {
                    schema: requestSchema.body,
                },
            },
        },
    },
    responses: {
        200: {
            description: favoriteEntryModel.schema.description ?? '',
            content: {
                [CONTENT_TYPE_JSON]: {
                    schema: favoriteEntryModel.schema,
                },
            },
        },
    },
};
renameFavoriteController.manualDecodeId = true;
