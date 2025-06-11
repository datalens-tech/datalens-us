import {AppRouteHandler, Response} from '@gravity-ui/expresskit';

import {ApiTag} from '../../components/api-docs';
import {prepareResponseAsync} from '../../components/response-presenter';
import {z, zc} from '../../components/zod';
import {CONTENT_TYPE_JSON} from '../../const';
import Entry from '../../db/models/entry';
import FavoriteService from '../../services/favorite.service';

import {favoriteEntryModel} from './response-models/favorite-entry-model';

const requestSchema = {
    params: z.object({
        entryId: zc.encodedId(),
    }),
};

export const deleteFavoriteController: AppRouteHandler = async (req, res: Response) => {
    const {params} = req;
    const entryId = params.entryId;

    const entry = await Entry.query(Entry.replica).select('tenantId').findById(entryId);

    if (!entry || entry.tenantId !== res.locals.tenantId) {
        res.status(404).send({error: 'Entry not found'});
        return;
    }

    const result = await FavoriteService.delete({
        entryId: entryId,
        ctx: req.ctx,
    });

    const {code, response} = await prepareResponseAsync({data: result});

    res.status(code).send(response);
};

deleteFavoriteController.api = {
    tags: [ApiTag.Favorites],
    summary: 'Delete entry from favorites',
    request: {
        params: requestSchema.params,
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
