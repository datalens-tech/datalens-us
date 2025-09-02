import {AppRouteHandler} from '@gravity-ui/expresskit';

import {ApiTag} from '../../components/api-docs';
import {makeReqParser, z, zc} from '../../components/zod';
import {CONTENT_TYPE_JSON} from '../../const';
import {renameFavorite} from '../../services/new/favorites/rename-favorite';

import {favoriteModel} from './response-models';

const requestSchema = {
    params: z.object({
        entryId: zc.encodedId(),
    }),
    body: z.object({
        name: zc.entityName().nullable(),
    }),
};

const parseReq = makeReqParser(requestSchema);

export const renameFavoriteController: AppRouteHandler = async (req, res) => {
    const {params, body} = await parseReq(req);
    const {entryId} = params;
    const {name} = body;

    const result = await renameFavorite({ctx: req.ctx}, {entryId, name});

    res.status(200).send(favoriteModel.format(result));
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
            description: `${favoriteModel.schema.description}`,
            content: {
                [CONTENT_TYPE_JSON]: {
                    schema: favoriteModel.schema,
                },
            },
        },
    },
};

renameFavoriteController.manualDecodeId = true;
