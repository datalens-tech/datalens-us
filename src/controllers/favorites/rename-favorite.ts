import {AppRouteHandler, Response} from '@gravity-ui/expresskit';

import {ApiTag} from '../../components/api-docs';
import {prepareResponseAsync} from '../../components/response-presenter';
import {z, zc} from '../../components/zod';
import {CONTENT_TYPE_JSON} from '../../const';
import FavoriteService from '../../services/favorite.service';

import {favoriteEntryModel} from './response-models/favorite-entry-model';

const requestSchema = {
    params: z.object({
        entryId: zc.encodedId(),
    }),
    body: z.object({
        name: z.string().min(1, 'Name cannot be empty'),
    }),
};
export const renameFavoriteController: AppRouteHandler = async (req, res: Response) => {
    const {params, body} = req;

    const result = await FavoriteService.rename({
        entryId: params.entryId,
        name: body.name,
        ctx: req.ctx,
    });

    const {code, response} = await prepareResponseAsync({data: result});

    res.status(code).send(response);
};

renameFavoriteController.api = {
    tags: [ApiTag.Favorites],
    summary: 'Rename favorite entry',
    description: 'Renames a favorite entry for the current user.',
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
